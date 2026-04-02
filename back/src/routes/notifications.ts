import { Router, Response } from 'express';
import pool from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// All notification routes require auth
router.use(authMiddleware);

// GET /api/notifications — get user's notifications
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!.id;
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
        const offset = (page - 1) * limit;

        const result = await pool.query(
            `SELECT n.*, 
                    u.username as related_username,
                    t.title as related_trip_title
             FROM notifications n
             LEFT JOIN users u ON n.related_user_id = u.id
             LEFT JOIN trips t ON n.related_trip_id = t.id
             WHERE n.user_id = $1
             ORDER BY n.created_at DESC
             LIMIT $2 OFFSET $3`,
            [userId, limit, offset]
        );

        const countResult = await pool.query(
            'SELECT COUNT(*) FROM notifications WHERE user_id = $1',
            [userId]
        );
        const total = parseInt(countResult.rows[0].count);

        res.json({
            notifications: result.rows,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        });
    } catch (err) {
        console.error('Get notifications error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/notifications/unread-count
router.get('/unread-count', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!.id;
        const result = await pool.query(
            'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = FALSE',
            [userId]
        );
        res.json({ count: parseInt(result.rows[0].count) });
    } catch (err) {
        console.error('Get unread count error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PATCH /api/notifications/:id/read — mark single notification as read
router.patch('/:id/read', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!.id;
        const { id } = req.params;

        const result = await pool.query(
            'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2 RETURNING id',
            [id, userId]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Notification not found' });
            return;
        }

        res.json({ message: 'Notification marked as read' });
    } catch (err) {
        console.error('Mark notification read error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/notifications/read-all — mark all as read
router.post('/read-all', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!.id;
        await pool.query(
            'UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE',
            [userId]
        );
        res.json({ message: 'All notifications marked as read' });
    } catch (err) {
        console.error('Mark all read error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;

// Helper: create a notification
export async function createNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
    relatedTripId?: string,
    relatedUserId?: string,
    relatedJoinRequestId?: string
): Promise<any> {
    const result = await pool.query(
        `INSERT INTO notifications (user_id, type, title, message, related_trip_id, related_user_id, related_join_request_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [userId, type, title, message, relatedTripId || null, relatedUserId || null, relatedJoinRequestId || null]
    );
    return result.rows[0];
}
