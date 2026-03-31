import { Router, Response } from 'express';
import pool from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { adminMiddleware } from '../middleware/admin';
import { logAction } from '../utils/logger';

const router = Router();

// Protect all admin routes
router.use(authMiddleware);
router.use(adminMiddleware);

// GET /api/admin/stats
router.get('/stats', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const usersCount = await pool.query('SELECT COUNT(*) FROM users');
        const tripsCount = await pool.query('SELECT COUNT(*) FROM trips');
        const reportsCount = await pool.query('SELECT COUNT(*) FROM reports WHERE status = $1', ['pending']);

        res.json({
            users: parseInt(usersCount.rows[0].count),
            trips: parseInt(tripsCount.rows[0].count),
            pendingReports: parseInt(reportsCount.rows[0].count),
        });
    } catch (err) {
        console.error('Admin stats error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/admin/users
router.get('/users', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const offset = (page - 1) * limit;

        const result = await pool.query(
            `SELECT id, username, email, role, gender, 
                    COALESCE(status, 'active') as status,
                    created_at 
             FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
            [limit, offset]
        );

        const countResult = await pool.query('SELECT COUNT(*) FROM users');
        const total = parseInt(countResult.rows[0].count);

        res.json({
            users: result.rows,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        });
    } catch (err) {
        console.error('Admin get users error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PATCH /api/admin/users/:id/role
router.patch('/users/:id/role', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!['user', 'admin'].includes(role)) {
            res.status(400).json({ error: 'Invalid role' });
            return;
        }

        const result = await pool.query(
            'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, username, role',
            [role, id]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        await logAction(req.user!.id, 'update_user_role', 'user', id as string, { newRole: role });

        res.json({ message: 'User role updated', user: result.rows[0] });
    } catch (err) {
        console.error('Admin update user role error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PATCH /api/admin/users/:id/status — suspend or ban a user
router.patch('/users/:id/status', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['active', 'suspended', 'banned'].includes(status)) {
            res.status(400).json({ error: 'Invalid status. Must be active, suspended, or banned.' });
            return;
        }

        // Prevent admin from modifying themselves
        if (id === req.user!.id) {
            res.status(400).json({ error: 'Cannot change your own status' });
            return;
        }

        const result = await pool.query(
            'UPDATE users SET status = $1 WHERE id = $2 RETURNING id, username, status',
            [status, id]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        await logAction(req.user!.id, `user_${status}`, 'user', id as string, { newStatus: status, username: result.rows[0].username });

        res.json({ message: `User ${status} successfully`, user: result.rows[0] });
    } catch (err) {
        console.error('Admin update user status error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        if (id === req.user!.id) {
            res.status(400).json({ error: 'Cannot delete yourself' });
            return;
        }

        const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING username', [id]);

        if (result.rows.length === 0) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        await logAction(req.user!.id, 'delete_user', 'user', id as string, { deletedUsername: result.rows[0].username });

        res.json({ message: 'User deleted' });
    } catch (err) {
        console.error('Admin delete user error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/admin/trips
router.get('/trips', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const offset = (page - 1) * limit;

        const result = await pool.query(
            `SELECT t.id, t.title, t.user_id, t.status, u.username, t.created_at
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
        console.error('Admin get trips error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/admin/trips/:id
router.delete('/trips/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const result = await pool.query('DELETE FROM trips WHERE id = $1 RETURNING title, user_id', [id]);

        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Trip not found' });
            return;
        }

        await logAction(req.user!.id, 'delete_trip', 'trip', id as string, { title: result.rows[0].title, owner_id: result.rows[0].user_id });

        res.json({ message: 'Trip deleted' });
    } catch (err) {
        console.error('Admin delete trip error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/admin/logs
router.get('/logs', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;
        const offset = (page - 1) * limit;

        const result = await pool.query(
            `SELECT l.id, l.action, l.target_type, l.target_id, l.details, l.created_at, u.username as performer
       FROM logs l
       LEFT JOIN users u ON l.user_id = u.id
       ORDER BY l.created_at DESC
       LIMIT $1 OFFSET $2`,
            [limit, offset]
        );

        const countResult = await pool.query('SELECT COUNT(*) FROM logs');
        const total = parseInt(countResult.rows[0].count);

        res.json({
            logs: result.rows,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        });
    } catch (err) {
        console.error('Admin get logs error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/admin/reports
router.get('/reports', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const offset = (page - 1) * limit;

        const result = await pool.query(
            `SELECT r.id, r.reporter_id, u1.username as reporter_username, 
                    r.target_type, r.target_id,
                    r.reason, r.description, r.status, r.created_at
             FROM reports r
             LEFT JOIN users u1 ON r.reporter_id = u1.id
             ORDER BY r.created_at DESC
             LIMIT $1 OFFSET $2`,
            [limit, offset]
        );

        const countResult = await pool.query('SELECT COUNT(*) FROM reports');
        const total = parseInt(countResult.rows[0].count);

        res.json({
            reports: result.rows,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        });
    } catch (err) {
        console.error('Admin get reports error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PATCH /api/admin/reports/:id
router.patch('/reports/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['pending', 'resolved', 'ignored'].includes(status)) {
            res.status(400).json({ error: 'Invalid status' });
            return;
        }

        const result = await pool.query(
            'UPDATE reports SET status = $1 WHERE id = $2 RETURNING id, status',
            [status, id]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Report not found' });
            return;
        }

        await logAction(req.user!.id, 'update_report_status', 'report', id as string, { newStatus: status });

        res.json({ message: 'Report status updated', report: result.rows[0] });
    } catch (err) {
        console.error('Admin update report error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
