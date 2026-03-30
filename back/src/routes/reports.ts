import { Router, Response } from 'express';
import pool from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Protect all report routes
router.use(authMiddleware);

// POST /api/reports
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { reported_id, trip_id, reason } = req.body;
        const reporter_id = req.user!.id;

        if (!reason) {
            res.status(400).json({ error: 'Reason is required' });
            return;
        }

        const result = await pool.query(
            'INSERT INTO reports (reporter_id, reported_id, trip_id, reason) VALUES ($1, $2, $3, $4) RETURNING id',
            [reporter_id, reported_id || null, trip_id || null, reason]
        );

        res.status(201).json({ message: 'Report submitted successfully', id: result.rows[0].id });
    } catch (err) {
        console.error('Submit report error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
