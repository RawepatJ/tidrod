import pool from './db';

export async function initDatabase(): Promise<void> {
    const client = await pool.connect();
    try {
        await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        gender VARCHAR(20) NOT NULL DEFAULT 'prefer_not',
        status VARCHAR(20) DEFAULT 'active',
        bio TEXT DEFAULT '',
        avatar_url TEXT,
        suspended_until TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(20) NOT NULL DEFAULT 'prefer_not';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMPTZ;

      CREATE TABLE IF NOT EXISTS trips (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        latitude DOUBLE PRECISION NOT NULL,
        longitude DOUBLE PRECISION NOT NULL,
        ladies_only BOOLEAN NOT NULL DEFAULT FALSE,
        privacy VARCHAR(20) DEFAULT 'open',
        status VARCHAR(20) DEFAULT 'open',
        max_members INT DEFAULT 4,
        ended_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      ALTER TABLE trips ADD COLUMN IF NOT EXISTS ladies_only BOOLEAN NOT NULL DEFAULT FALSE;
      ALTER TABLE trips ADD COLUMN IF NOT EXISTS privacy VARCHAR(20) DEFAULT 'open';
      ALTER TABLE trips ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'open';
      ALTER TABLE trips ADD COLUMN IF NOT EXISTS max_members INT DEFAULT 4;
      ALTER TABLE trips ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ;

      CREATE TABLE IF NOT EXISTS trip_photos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
        image_url VARCHAR(1024) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        reporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
        target_type VARCHAR(50) NOT NULL DEFAULT 'TRIP',
        target_id UUID,
        reason TEXT NOT NULL,
        description TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      ALTER TABLE reports ADD COLUMN IF NOT EXISTS target_type VARCHAR(50) NOT NULL DEFAULT 'TRIP';
      ALTER TABLE reports ADD COLUMN IF NOT EXISTS target_id UUID;
      ALTER TABLE reports ADD COLUMN IF NOT EXISTS description TEXT;

      CREATE TABLE IF NOT EXISTS logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(100) NOT NULL,
        target_type VARCHAR(50),
        target_id UUID,
        details JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS trip_ratings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(trip_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT,
        related_trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
        related_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        related_join_request_id UUID REFERENCES trip_join_requests(id) ON DELETE SET NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS trip_join_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(trip_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS trip_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        joined_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(trip_id, user_id)
      );

      CREATE INDEX IF NOT EXISTS idx_trips_location ON trips (latitude, longitude);
      CREATE INDEX IF NOT EXISTS idx_messages_trip ON messages (trip_id, created_at);
      CREATE INDEX IF NOT EXISTS idx_trip_photos_trip ON trip_photos (trip_id);
      CREATE INDEX IF NOT EXISTS idx_reports_status ON reports (status);
      CREATE INDEX IF NOT EXISTS idx_logs_action ON logs (action);
      CREATE INDEX IF NOT EXISTS idx_trip_ratings_trip ON trip_ratings (trip_id);
      CREATE INDEX IF NOT EXISTS idx_trip_ratings_user ON trip_ratings (user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (user_id, is_read);
      ALTER TABLE notifications ADD COLUMN IF NOT EXISTS related_join_request_id UUID REFERENCES trip_join_requests(id) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS idx_join_requests_trip ON trip_join_requests (trip_id, status);
      CREATE INDEX IF NOT EXISTS idx_trip_members_trip ON trip_members (trip_id);
    `);
        console.log('✅ Database tables initialized');
    } catch (err) {
        console.error('❌ Failed to initialize database:', err);
        throw err;
    } finally {
        client.release();
    }
}
