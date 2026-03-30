import dotenv from 'dotenv';
import path from 'path';

// Load env vars BEFORE importing anything that uses them
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function makeAdmin() {
    const { default: pool } = await import('../db');
    const email = process.argv[2];

    if (!email) {
        console.error('❌ Please provide an email address: npx tsx src/scripts/make-admin.ts <email>');
        process.exit(1);
    }

    try {
        const result = await pool.query(
            'UPDATE users SET role = $1 WHERE email = $2 RETURNING id, username, email, role',
            ['admin', email]
        );

        if (result.rows.length === 0) {
            console.log(`❌ User with email ${email} not found.`);
        } else {
            console.log(`✅ successfully promoted user ${result.rows[0].username} to admin.`);
        }
    } catch (error) {
        console.error('Error promoting admin:', error);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

makeAdmin();
