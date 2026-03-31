import { Router, Response } from 'express';
import multer from 'multer';
import pool from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { uploadToSupabase } from '../storage';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

// GET /api/trips — list all trips (paginated)
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
        const offset = (page - 1) * limit;

        const result = await pool.query(
            `SELECT t.id, t.title, t.description, t.latitude, t.longitude, t.created_at,
              u.username, u.id as user_id,
              (SELECT json_agg(json_build_object('id', tp.id, 'image_url', tp.image_url))
               FROM trip_photos tp WHERE tp.trip_id = t.id) as photos
       FROM trips t
       JOIN users u ON t.user_id = u.id
       ORDER BY t.created_at DESC
       LIMIT $1 OFFSET $2`,
            [limit, offset]
        );

        const countResult = await pool.query('SELECT COUNT(*) FROM trips');
        const total = parseInt(countResult.rows[0].count);

        res.json({
            trips: result.rows,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        });
    } catch (err) {
        console.error('Get trips error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/trips/:id — single trip with photos
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT t.*, u.username, u.id as author_id,
              (SELECT json_agg(json_build_object('id', tp.id, 'image_url', tp.image_url))
               FROM trip_photos tp WHERE tp.trip_id = t.id) as photos
       FROM trips t
       JOIN users u ON t.user_id = u.id
       WHERE t.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Trip not found' });
            return;
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Get trip error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/trips — create trip (auth required)
router.post('/', authMiddleware, upload.array('photos', 10), async (req: AuthRequest, res: Response): Promise<void> => {
    const client = await pool.connect();
    try {
        const { title, description, latitude, longitude } = req.body;

        if (!title || latitude == null || longitude == null) {
            res.status(400).json({ error: 'Title, latitude, and longitude are required' });
            return;
        }

        await client.query('BEGIN');

        const tripResult = await client.query(
            'INSERT INTO trips (user_id, title, description, latitude, longitude) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [req.user!.id, title, description || '', parseFloat(latitude), parseFloat(longitude)]
        );

        const trip = tripResult.rows[0];

        // Upload photos to Supabase Storage
        const files = req.files as Express.Multer.File[] | undefined;
        const photoUrls: string[] = [];

        if (files && files.length > 0) {
            for (const file of files) {
                const url = await uploadToSupabase(file, trip.id);
                if (url) {
                    await client.query(
                        'INSERT INTO trip_photos (trip_id, image_url) VALUES ($1, $2)',
                        [trip.id, url]
                    );
                    photoUrls.push(url);
                }
            }
        }

        await client.query('COMMIT');

        res.status(201).json({
            ...trip,
            username: req.user!.username,
            photos: photoUrls.map((url, i) => ({ id: `temp-${i}`, image_url: url })),
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Create trip error:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
});

// DELETE /api/trips/:id — delete trip (auth, must be owner)
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const result = await pool.query('SELECT user_id FROM trips WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Trip not found' });
            return;
        }

        if (result.rows[0].user_id !== req.user!.id) {
            res.status(403).json({ error: 'Not authorized to delete this trip' });
            return;
        }

        await pool.query('DELETE FROM trips WHERE id = $1', [id]);
        res.json({ message: 'Trip deleted' });
    } catch (err) {
        console.error('Delete trip error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/trips/:id/rating — get trip average rating
router.get('/:id/rating', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT 
                COUNT(id) as total_ratings,
                ROUND(AVG(rating)::numeric, 2) as average_rating
             FROM trip_ratings
             WHERE trip_id = $1`,
            [id]
        );

        const stats = result.rows[0];
        res.json({
            trip_id: id,
            total_ratings: parseInt(stats.total_ratings) || 0,
            average_rating: stats.average_rating ? parseFloat(stats.average_rating) : 0,
        });
    } catch (err) {
        console.error('Get trip rating error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/trips/:id/rating — rate a trip (auth required)
router.post('/:id/rating', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { rating, comment } = req.body;
        const userId = req.user!.id;

        if (!rating || rating < 1 || rating > 5) {
            res.status(400).json({ error: 'Rating must be between 1 and 5' });
            return;
        }

        // Check if trip exists
        const tripCheck = await pool.query('SELECT user_id FROM trips WHERE id = $1', [id]);
        if (tripCheck.rows.length === 0) {
            res.status(404).json({ error: 'Trip not found' });
            return;
        }

        // Don't allow rating own trip
        if (tripCheck.rows[0].user_id === userId) {
            res.status(400).json({ error: 'Cannot rate your own trip' });
            return;
        }

        // Insert or update rating (upsert)
        const result = await pool.query(
            `INSERT INTO trip_ratings (trip_id, user_id, rating, comment)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (trip_id, user_id)
             DO UPDATE SET rating = $3, comment = $4, created_at = NOW()
             RETURNING *`,
            [id, userId, rating, comment || null]
        );

        res.json({ message: 'Rating saved successfully', rating: result.rows[0] });
    } catch (err) {
        console.error('Rate trip error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/trips/:id/ratings — get all ratings for a trip
router.get('/:id/ratings', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT tr.*, u.username, u.avatar_url
             FROM trip_ratings tr
             JOIN users u ON tr.user_id = u.id
             WHERE tr.trip_id = $1
             ORDER BY tr.created_at DESC`,
            [id]
        );

        res.json({ ratings: result.rows });
    } catch (err) {
        console.error('Get trip ratings error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
