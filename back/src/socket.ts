import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import pool from './db';

export function setupSocket(httpServer: HttpServer): Server {
    const io = new Server(httpServer, {
        cors: {
            origin: process.env.FRONTEND_URL,
            methods: ['GET', 'POST'],
        },
    });

    // Auth middleware for socket connections
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) {
            return next(new Error('Authentication required'));
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as {
                id: string;
                email: string;
                username: string;
            };
            (socket as any).user = decoded;
            next();
        } catch {
            next(new Error('Invalid token'));
        }
    });

    const canAccessTrip = async (tripId: string, userId: string) => {
        const tripResult = await pool.query('SELECT ladies_only FROM trips WHERE id = $1', [tripId]);
        if (tripResult.rows.length === 0) {
            return { allowed: false, error: 'Trip not found' };
        }

        if (!tripResult.rows[0].ladies_only) {
            return { allowed: true };
        }

        const userResult = await pool.query('SELECT gender FROM users WHERE id = $1', [userId]);
        if (userResult.rows.length === 0) {
            return { allowed: false, error: 'User not found' };
        }

        if (userResult.rows[0].gender !== 'female') {
            return { allowed: false, error: 'Only women can join ladies-only trips' };
        }

        return { allowed: true };
    };

    io.on('connection', (socket) => {
        const user = (socket as any).user;
        console.log(`🔌 User connected: ${user.username} (${socket.id})`);

        // Join trip room
        socket.on('join_trip_room', async (tripId: string) => {
            try {
                const access = await canAccessTrip(tripId, user.id);
                if (!access.allowed) {
                    socket.emit('error_message', { error: access.error || 'Not authorized to join this trip' });
                    return;
                }

                const room = `trip_${tripId}`;
                socket.join(room);
                console.log(`📍 ${user.username} joined room: ${room}`);
            } catch (err) {
                console.error('Socket join_trip_room error:', err);
                socket.emit('error_message', { error: 'Failed to join trip chat' });
            }
        });

        // Leave trip room
        socket.on('leave_trip_room', (tripId: string) => {
            const room = `trip_${tripId}`;
            socket.leave(room);
            console.log(`🚪 ${user.username} left room: ${room}`);
        });

        // Send message
        socket.on('send_message', async (data: { tripId: string; content: string }) => {
            try {
                const { tripId, content } = data;

                if (!tripId || !content || content.trim().length === 0) return;

                const access = await canAccessTrip(tripId, user.id);
                if (!access.allowed) {
                    socket.emit('error_message', { error: access.error || 'Not authorized to send messages' });
                    return;
                }

                // Save to database
                const result = await pool.query(
                    'INSERT INTO messages (trip_id, user_id, content) VALUES ($1, $2, $3) RETURNING id, content, created_at',
                    [tripId, user.id, content.trim()]
                );

                const message = result.rows[0];
                const payload = {
                    id: message.id,
                    content: message.content,
                    created_at: message.created_at,
                    user_id: user.id,
                    username: user.username,
                };

                // Broadcast to the trip room
                io.to(`trip_${tripId}`).emit('receive_message', payload);
            } catch (err) {
                console.error('Socket send_message error:', err);
                socket.emit('error_message', { error: 'Failed to send message' });
            }
        });

        socket.on('disconnect', () => {
            console.log(`🔌 User disconnected: ${user.username} (${socket.id})`);
        });
    });

    return io;
}
