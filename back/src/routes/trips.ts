import { Router, Response } from 'express';
import multer from 'multer';
import pool from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { uploadToSupabase } from '../storage';
import { createNotification } from './notifications';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// GET /api/trips — list all trips (paginated)
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
        const offset = (page - 1) * limit;

        const result = await pool.query(
            `SELECT t.id, t.title, t.description, t.latitude, t.longitude, t.created_at,
                    t.ladies_only as "ladiesOnly",
                    t.privacy, t.status,
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

// GET /api/trips/search — search trips by title
router.get('/search', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const q = (req.query.q as string || '').trim();
        if (q.length < 2) {
            res.json({ trips: [] });
            return;
        }

        const result = await pool.query(
            `SELECT t.id, t.title, t.description, t.latitude, t.longitude, t.created_at,
                    t.ladies_only as "ladiesOnly", t.privacy, t.status,
                    u.username, u.id as user_id,
                    (SELECT json_agg(json_build_object('id', tp.id, 'image_url', tp.image_url))
                     FROM trip_photos tp WHERE tp.trip_id = t.id) as photos
             FROM trips t
             JOIN users u ON t.user_id = u.id
             WHERE t.title ILIKE $1
             ORDER BY t.created_at DESC
             LIMIT 20`,
            [`%${q}%`]
        );

        res.json({ trips: result.rows });
    } catch (err) {
        console.error('Search trips error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/trips/:id — single trip with photos
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT t.id, t.user_id, t.title, t.description, t.latitude, t.longitude, t.created_at,
                    t.ladies_only as "ladiesOnly",
                    t.privacy, t.status, t.ended_at,
                    u.username, u.id as author_id,
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
        const { title, description, latitude, longitude, ladiesOnly, privacy } = req.body;
        const isLadiesOnly = ladiesOnly === 'true' || ladiesOnly === true;
        const tripPrivacy = privacy === 'private' ? 'private' : 'open';

        if (!title || latitude == null || longitude == null) {
            res.status(400).json({ error: 'Title, latitude, and longitude are required' });
            return;
        }

        if (isLadiesOnly) {
            const genderResult = await client.query('SELECT gender FROM users WHERE id = $1', [req.user!.id]);
            if (genderResult.rows.length === 0) {
                res.status(403).json({ error: 'User not found' });
                return;
            }
            if (genderResult.rows[0].gender !== 'female') {
                res.status(403).json({ error: 'Only women can create ladies-only trips' });
                return;
            }
        }

        await client.query('BEGIN');

        const tripResult = await client.query(
            `INSERT INTO trips (user_id, title, description, latitude, longitude, ladies_only, privacy)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id, user_id, title, description, latitude, longitude, created_at,
                       ladies_only as "ladiesOnly", privacy, status`,
            [req.user!.id, title, description || '', parseFloat(latitude), parseFloat(longitude), isLadiesOnly, tripPrivacy]
        );

        const trip = tripResult.rows[0];

        // Auto-add creator as trip member
        await client.query(
            'INSERT INTO trip_members (trip_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [trip.id, req.user!.id]
        );

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

// POST /api/trips/:id/end — end trip (host only)
router.post('/:id/end', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.user!.id;

        const tripCheck = await pool.query('SELECT user_id, status FROM trips WHERE id = $1', [id]);
        if (tripCheck.rows.length === 0) {
            res.status(404).json({ error: 'Trip not found' });
            return;
        }
        if (tripCheck.rows[0].user_id !== userId) {
            res.status(403).json({ error: 'Only the trip host can end the trip' });
            return;
        }
        if (tripCheck.rows[0].status === 'ended') {
            res.status(400).json({ error: 'Trip is already ended' });
            return;
        }

        await pool.query(
            'UPDATE trips SET status = $1, ended_at = NOW() WHERE id = $2',
            ['ended', id]
        );

        // Notify all members
        const members = await pool.query(
            'SELECT user_id FROM trip_members WHERE trip_id = $1 AND user_id != $2',
            [id, userId]
        );
        for (const member of members.rows) {
            await createNotification(
                member.user_id,
                'trip_ended',
                'Trip Ended',
                `The trip "${tripCheck.rows[0].title || 'a trip'}" has been ended by the host. You can now rate it!`,
                id as string,
                userId
            );
        }

        res.json({ message: 'Trip ended successfully' });
    } catch (err) {
        console.error('End trip error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/trips/:id/join — request to join trip
router.post('/:id/join', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.user!.id;

        const tripCheck = await pool.query('SELECT user_id, privacy, ladies_only, title, status FROM trips WHERE id = $1', [id]);
        if (tripCheck.rows.length === 0) {
            res.status(404).json({ error: 'Trip not found' });
            return;
        }

        const trip = tripCheck.rows[0];

        if (trip.status === 'ended') {
            res.status(400).json({ error: 'This trip has ended' });
            return;
        }

        // Check ladies only
        if (trip.ladies_only) {
            const userResult = await pool.query('SELECT gender FROM users WHERE id = $1', [userId]);
            if (userResult.rows[0]?.gender !== 'female') {
                res.status(403).json({ error: 'Only women can join ladies-only trips' });
                return;
            }
        }

        // Check if already a member
        const memberCheck = await pool.query(
            'SELECT id FROM trip_members WHERE trip_id = $1 AND user_id = $2',
            [id, userId]
        );
        if (memberCheck.rows.length > 0) {
            res.status(400).json({ error: 'You are already a member of this trip' });
            return;
        }

        if (trip.privacy === 'private') {
            // Check if already requested
            const existingReq = await pool.query(
                'SELECT id, status FROM trip_join_requests WHERE trip_id = $1 AND user_id = $2',
                [id, userId]
            );
            if (existingReq.rows.length > 0) {
                res.status(400).json({ error: `You already have a ${existingReq.rows[0].status} join request` });
                return;
            }

            // Create join request
            await pool.query(
                'INSERT INTO trip_join_requests (trip_id, user_id) VALUES ($1, $2)',
                [id, userId]
            );

            // Notify the trip host
            await createNotification(
                trip.user_id,
                'join_request',
                'Join Request',
                `${req.user!.username} wants to join your trip "${trip.title}"`,
                id as string,
                userId
            );

            res.json({ message: 'Join request sent', status: 'pending' });
        } else {
            // Open trip — auto join
            await pool.query(
                'INSERT INTO trip_members (trip_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                [id, userId]
            );
            res.json({ message: 'Joined trip successfully', status: 'joined' });
        }
    } catch (err) {
        console.error('Join trip error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/trips/:id/join-requests — list pending join requests (host only)
router.get('/:id/join-requests', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.user!.id;

        // Verify host
        const tripCheck = await pool.query('SELECT user_id FROM trips WHERE id = $1', [id]);
        if (tripCheck.rows.length === 0) {
            res.status(404).json({ error: 'Trip not found' });
            return;
        }
        if (tripCheck.rows[0].user_id !== userId) {
            res.status(403).json({ error: 'Only the trip host can view join requests' });
            return;
        }

        const result = await pool.query(
            `SELECT jr.id, jr.status, jr.created_at,
                    u.id as user_id, u.username, u.avatar_url, u.gender
             FROM trip_join_requests jr
             JOIN users u ON jr.user_id = u.id
             WHERE jr.trip_id = $1
             ORDER BY jr.created_at DESC`,
            [id]
        );

        res.json({ requests: result.rows });
    } catch (err) {
        console.error('Get join requests error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PATCH /api/trips/:id/join-requests/:requestId — approve/deny join request
router.patch('/:id/join-requests/:requestId', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id, requestId } = req.params;
        const { status } = req.body;
        const userId = req.user!.id;

        if (!['approved', 'denied'].includes(status)) {
            res.status(400).json({ error: 'Status must be approved or denied' });
            return;
        }

        // Verify host
        const tripCheck = await pool.query('SELECT user_id, title FROM trips WHERE id = $1', [id]);
        if (tripCheck.rows.length === 0) {
            res.status(404).json({ error: 'Trip not found' });
            return;
        }
        if (tripCheck.rows[0].user_id !== userId) {
            res.status(403).json({ error: 'Only the trip host can manage join requests' });
            return;
        }

        const reqResult = await pool.query(
            'UPDATE trip_join_requests SET status = $1 WHERE id = $2 AND trip_id = $3 RETURNING user_id',
            [status, requestId, id]
        );

        if (reqResult.rows.length === 0) {
            res.status(404).json({ error: 'Join request not found' });
            return;
        }

        const requestUserId = reqResult.rows[0].user_id;

        if (status === 'approved') {
            // Add as member
            await pool.query(
                'INSERT INTO trip_members (trip_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                [id, requestUserId]
            );
            await createNotification(
                requestUserId,
                'join_approved',
                'Join Approved',
                `Your request to join "${tripCheck.rows[0].title}" has been approved!`,
                id as string,
                userId
            );
        } else {
            await createNotification(
                requestUserId,
                'join_denied',
                'Join Denied',
                `Your request to join "${tripCheck.rows[0].title}" has been denied.`,
                id as string,
                userId
            );
        }

        res.json({ message: `Join request ${status}` });
    } catch (err) {
        console.error('Manage join request error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/trips/:id/members — list trip members
router.get('/:id/members', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT tm.joined_at,
                    u.id as user_id, u.username, u.avatar_url, u.gender
             FROM trip_members tm
             JOIN users u ON tm.user_id = u.id
             WHERE tm.trip_id = $1
             ORDER BY tm.joined_at ASC`,
            [id]
        );

        res.json({ members: result.rows });
    } catch (err) {
        console.error('Get trip members error:', err);
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

        // Check if trip exists and get its status
        const tripCheck = await pool.query('SELECT user_id, status FROM trips WHERE id = $1', [id]);
        if (tripCheck.rows.length === 0) {
            res.status(404).json({ error: 'Trip not found' });
            return;
        }

        // Don't allow rating own trip
        if (tripCheck.rows[0].user_id === userId) {
            res.status(400).json({ error: 'Cannot rate your own trip' });
            return;
        }

        // Trip must be ended to rate
        if (tripCheck.rows[0].status !== 'ended') {
            res.status(400).json({ error: 'You can only rate a trip after it has ended' });
            return;
        }

        // User must be a trip member to rate
        const memberCheck = await pool.query(
            'SELECT id FROM trip_members WHERE trip_id = $1 AND user_id = $2',
            [id, userId]
        );
        if (memberCheck.rows.length === 0) {
            res.status(403).json({ error: 'Only trip members can rate this trip' });
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
