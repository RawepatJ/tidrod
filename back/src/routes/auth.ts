import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db';

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

        const result = await pool.query(
            'INSERT INTO users (username, email, password_hash, gender) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role, gender, created_at',
            [username, email, password_hash, normalizedGender]
        );

        const user = result.rows[0];
        const token = jwt.sign(
            { id: user.id, email: user.email, username: user.username, role: user.role, gender: user.gender },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '7d' }
        );

        res.status(201).json({
            user: { id: user.id, username: user.username, email: user.email, role: user.role, gender: user.gender, created_at: user.created_at },
            token,
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

        const token = jwt.sign(
            { id: user.id, email: user.email, username: user.username, role: user.role, gender: user.gender },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '7d' }
        );

        res.json({
            user: { id: user.id, username: user.username, email: user.email, role: user.role, gender: user.gender, created_at: user.created_at },
            token,
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
