import pool from '../db';

export async function logAction(
    userId: string | null,
    action: string,
    targetType: string | null = null,
    targetId: string | null = null,
    details: any = null
): Promise<void> {
    try {
        await pool.query(
            'INSERT INTO logs (user_id, action, target_type, target_id, details) VALUES ($1, $2, $3, $4, $5)',
            [userId, action, targetType, targetId, details ? JSON.stringify(details) : null]
        );
    } catch (err) {
        console.error('Failed to write log:', err);
    }
}
