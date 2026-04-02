import { Router, Response } from 'express';
import pool from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/users/me — get current user profile with their trips
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!.id;

        const userResult = await pool.query(
            `SELECT id, username, email,
                    role,
                    gender,
                    COALESCE(bio, '') as bio,
                    avatar_url,
                    status,
                    suspended_until,
                    created_at 
             FROM users WHERE id = $1`,
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
            `SELECT id, username, gender,
                    COALESCE(bio, '') as bio,
                    avatar_url,
                    created_at 
             FROM users WHERE id = $1`,
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

// PUT /api/users/me — update current user profile
router.put('/me', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!.id;
        const { username, bio, avatar_url } = req.body;

        if (!username || username.trim().length === 0) {
            res.status(400).json({ error: 'Username is required' });
            return;
        }

        const result = await pool.query(
            `UPDATE users 
             SET username = $1, bio = $2, avatar_url = $3 
             WHERE id = $4 
             RETURNING id, username, email, role, status, gender, bio, avatar_url, created_at`,
            [username.trim(), bio || '', avatar_url || null, userId]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.json({ user: result.rows[0], message: 'Profile updated successfully' });
    } catch (err) {
        console.error('Update profile error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/users/:id/rating — get user's average rating from all trips
router.get('/:id/rating', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT 
                COUNT(tr.id) as total_ratings,
                ROUND(AVG(tr.rating)::numeric, 2) as average_rating
             FROM trip_ratings tr
             JOIN trips t ON tr.trip_id = t.id
             WHERE t.user_id = $1`,
            [id]
        );

        const stats = result.rows[0];
        res.json({
            user_id: id,
            total_ratings: parseInt(stats.total_ratings) || 0,
            average_rating: stats.average_rating ? parseFloat(stats.average_rating) : 0,
        });
    } catch (err) {
        console.error('Get user rating error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
