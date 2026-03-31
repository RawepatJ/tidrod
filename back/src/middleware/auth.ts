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
        };

        // Check if user is banned or suspended
        const userCheck = await pool.query(
            'SELECT COALESCE(status, \'active\') as status FROM users WHERE id = $1',
            [decoded.id]
        );

        if (userCheck.rows.length === 0) {
            res.status(401).json({ error: 'User not found' });
            return;
        }

        const userStatus = userCheck.rows[0].status;
        if (userStatus === 'banned') {
            res.status(403).json({ error: 'Your account has been banned' });
            return;
        }
        if (userStatus === 'suspended') {
            res.status(403).json({ error: 'Your account has been suspended' });
            return;
        }

        req.user = decoded;
        next();
    } catch {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
}
