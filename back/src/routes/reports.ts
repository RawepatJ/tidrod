import { Router } from 'express';
import pool from '../db';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/', authMiddleware, async (req: any, res) => {
    try {
        const reporterId = req.user.id;
        const { targetType, targetId, reason, description } = req.body;

        if (!targetType || !targetId || !reason) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const validTypes = ['TRIP', 'USER', 'MESSAGE'];
        if (!validTypes.includes(targetType.toUpperCase())) {
            return res.status(400).json({ error: 'Invalid target type' });
        }

        const result = await pool.query(
            `INSERT INTO reports (reporter_id, target_type, target_id, reason, description)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, status, created_at`,
            [reporterId, targetType.toUpperCase(), targetId, reason, description || null]
        );

        res.status(201).json({ message: 'Report submitted successfully', report: result.rows[0] });
    } catch (error) {
        console.error('Error submitting report:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
