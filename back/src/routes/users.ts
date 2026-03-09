import { Router, Response } from 'express';
import pool from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/users/me — get current user profile with their trips
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!.id;

        const userResult = await pool.query(
            'SELECT id, username, email, created_at FROM users WHERE id = $1',
            [userId]
        );

        if (userResult.rows.length === 0) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        const tripsResult = await pool.query(
            `SELECT t.id, t.title, t.description, t.latitude, t.longitude, t.created_at,
              (SELECT json_agg(json_build_object('id', tp.id, 'image_url', tp.image_url))
               FROM trip_photos tp WHERE tp.trip_id = t.id) as photos
       FROM trips t
       WHERE t.user_id = $1
       ORDER BY t.created_at DESC`,
            [userId]
        );

        res.json({
            user: userResult.rows[0],
            trips: tripsResult.rows,
        });
    } catch (err) {
        console.error('Get profile error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/users/:id — get public user profile
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const userResult = await pool.query(
            'SELECT id, username, created_at FROM users WHERE id = $1',
            [id]
        );

        if (userResult.rows.length === 0) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        const tripsResult = await pool.query(
            `SELECT t.id, t.title, t.latitude, t.longitude, t.created_at
       FROM trips t
       WHERE t.user_id = $1
       ORDER BY t.created_at DESC`,
            [id]
        );

        res.json({
            user: userResult.rows[0],
            trips: tripsResult.rows,
        });
    } catch (err) {
        console.error('Get user error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
