import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../db';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        username: string;
        role: string;
        gender: string;
        status: string;
        email_verified: boolean;
    };
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'No token provided' });
        return;
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as {
            id: string;
            email: string;
            username: string;
            role: string;
            gender: string;
            email_verified: boolean;
        };

        // Check if user is banned or suspended
        const userCheck = await pool.query(
            'SELECT COALESCE(status, \'active\') as status, suspended_until, email_verified FROM users WHERE id = $1',
            [decoded.id]
        );

        if (userCheck.rows.length === 0) {
            res.status(401).json({ error: 'User not found' });
            return;
        }

        let userStatus = userCheck.rows[0].status;
        const suspendedUntil = userCheck.rows[0].suspended_until;
        const dbEmailVerified = !!userCheck.rows[0].email_verified;

        // Auto-reactivate if suspension expired
        if (userStatus === 'suspended' && suspendedUntil && new Date(suspendedUntil) < new Date()) {
            await pool.query("UPDATE users SET status = 'active', suspended_until = NULL WHERE id = $1", [decoded.id]);
            userStatus = 'active';
        }

        if (userStatus === 'banned') {
            res.status(403).json({ error: 'Your account has been permanently banned.' });
            return;
        }

        // We allow suspended users to proceed to the next middleware/route,
        // but we include their status in the request so specific action routes can block them.
        req.user = { ...decoded, status: userStatus, email_verified: dbEmailVerified };
        next();
    } catch {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
}

export function verifiedMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
    if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
    }

    if (!req.user.email_verified) {
        res.status(403).json({ error: 'Please verify your email to access this feature.' });
        return;
    }

    next();
}
