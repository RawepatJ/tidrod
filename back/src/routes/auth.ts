import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db';
import { v4 as uuidv4 } from 'uuid';
import { sendVerificationEmail, sendResetPasswordEmail } from '../utils/email';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response): Promise<void> => {
    try {
        const { username, email, password, gender } = req.body;
        const normalizedGender = String(gender || '').toLowerCase();
        const allowedGenders = new Set(['female', 'male', 'prefer_not']);

        if (!username || !email || !password || !normalizedGender) {
            res.status(400).json({ error: 'Username, email, password, and gender are required' });
            return;
        }

        if (password.length < 8) {
            res.status(400).json({ error: 'Password must be at least 8 characters' });
            return;
        }

        if (!allowedGenders.has(normalizedGender)) {
            res.status(400).json({ error: 'Invalid gender selection' });
            return;
        }

        // Check if user exists
        const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            res.status(409).json({ error: 'Email already registered' });
            return;
        }

        const password_hash = await bcrypt.hash(password, 12);
        const verificationToken = uuidv4();
        console.log(`[Register] Verification token generated for ${email}: ${verificationToken}`);
        const result = await pool.query(
            'INSERT INTO users (username, email, password_hash, gender, verification_token) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, role, gender, created_at',
            [username, email, password_hash, normalizedGender, verificationToken]
        );

        const user = result.rows[0];

        // Send verification email (non-blocking)
        sendVerificationEmail(user.email, verificationToken).catch(err => {
            console.error('Failed to send verification email on register:', err);
        });

        const token = jwt.sign(
            { id: user.id, email: user.email, username: user.username, role: user.role, gender: user.gender, email_verified: false },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '7d' }
        );

        res.status(201).json({
            user: { id: user.id, username: user.username, email: user.email, role: user.role, gender: user.gender, email_verified: false, created_at: user.created_at },
            token,
            message: 'Registration successful! Please check your email to verify your account.'
        });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }

        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            res.status(401).json({ error: 'Invalid email or password' });
            return;
        }

        const user = result.rows[0];
        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
            res.status(401).json({ error: 'Invalid email or password' });
            return;
        }

        // Check status
        let userStatus = user.status || 'active';
        const suspendedUntil = user.suspended_until;

        // Auto-reactivate if suspension expired
        if (userStatus === 'suspended' && suspendedUntil && new Date(suspendedUntil) < new Date()) {
            await pool.query("UPDATE users SET status = 'active', suspended_until = NULL WHERE id = $1", [user.id]);
            userStatus = 'active';
        }

        if (userStatus === 'banned') {
            res.status(403).json({ error: 'Your account has been permanently banned.' });
            return;
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, username: user.username, role: user.role, gender: user.gender, email_verified: !!user.email_verified, status: userStatus },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '7d' }
        );

        res.json({
            user: { id: user.id, username: user.username, email: user.email, role: user.role, gender: user.gender, email_verified: !!user.email_verified, created_at: user.created_at, status: userStatus },
            token,
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/auth/verify-email
router.post('/verify-email', async (req: Request, res: Response): Promise<void> => {
    try {
        const { token } = req.body;
        if (!token) {
            res.status(400).json({ error: 'Verification token is required' });
            return;
        }

        console.log(`[VerifyEmail] Attempting to verify with token: ${token}`);
        const result = await pool.query(
            'UPDATE users SET email_verified = TRUE, verification_token = NULL WHERE verification_token = $1 RETURNING id, username, email_verified',
            [token]
        );

        if (result.rows.length === 0) {
            console.warn(`[VerifyEmail] No user found with token: ${token}`);
            res.status(400).json({ error: 'Invalid, expired, or already used verification token.' });
            return;
        }

        res.json({ message: 'Email verified successfully! You can now access all features.' });
    } catch (err) {
        console.error('Verify email error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/auth/resend-verification
router.post('/resend-verification', async (req: Request, res: Response): Promise<void> => {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(400).json({ error: 'Email is required' });
            return;
        }

        const result = await pool.query('SELECT id, email, email_verified, verification_token FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Email not found' });
            return;
        }

        const user = result.rows[0];
        if (user.email_verified) {
            res.status(400).json({ error: 'Email is already verified' });
            return;
        }

        const newToken = uuidv4();
        const oldToken = result.rows[0].verification_token;
        console.log(`[ResendVerify] Replacing old token (${oldToken}) with new token (${newToken}) for ${user.email}`);
        await pool.query('UPDATE users SET verification_token = $1 WHERE id = $2', [newToken, user.id]);

        await sendVerificationEmail(user.email, newToken);

        res.json({ message: 'Verification email resent! Please check your inbox.' });
    } catch (err) {
        console.error('Resend verification error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req: Request, res: Response): Promise<void> => {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(400).json({ error: 'Email is required' });
            return;
        }

        const result = await pool.query('SELECT id, email FROM users WHERE email = $1', [email]);
        // Even if we don't find it, we should not disclose for security
        if (result.rows.length > 0) {
            const resetToken = uuidv4();
            await pool.query('UPDATE users SET reset_token = $1 WHERE id = $2', [resetToken, result.rows[0].id]);
            await sendResetPasswordEmail(email, resetToken);
        }

        res.json({ message: 'If an account exists with this email, a reset link has been sent.' });
    } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req: Request, res: Response): Promise<void> => {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) {
            res.status(400).json({ error: 'Token and new password are required' });
            return;
        }

        if (newPassword.length < 8) {
            res.status(400).json({ error: 'New password must be at least 8 characters' });
            return;
        }

        const password_hash = await bcrypt.hash(newPassword, 12);
        const result = await pool.query(
            'UPDATE users SET password_hash = $1, reset_token = NULL WHERE reset_token = $2 RETURNING id',
            [password_hash, token]
        );

        if (result.rows.length === 0) {
            res.status(400).json({ error: 'Invalid or expired reset token' });
            return;
        }

        res.json({ message: 'Password reset successful! You can now log in with your new password.' });
    } catch (err) {
        console.error('Reset password error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
