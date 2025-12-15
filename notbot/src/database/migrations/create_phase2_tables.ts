import { db } from '../db';

export async function run() {
    // Custom Roles Table
    await db.execute(`
        CREATE TABLE IF NOT EXISTS user_custom_roles (
            user_id TEXT NOT NULL,
            role_id TEXT NOT NULL,
            role_name TEXT NOT NULL,
            created_at INTEGER,
            PRIMARY KEY (user_id, role_id)
        )
    `);

    // Marriages Table
    await db.execute(`
        CREATE TABLE IF NOT EXISTS marriages (
            user1_id TEXT NOT NULL,
            user2_id TEXT NOT NULL,
            timestamp INTEGER NOT NULL,
            level INTEGER DEFAULT 1,
            PRIMARY KEY (user1_id, user2_id)
        )
    `);

    // Add columns to existing tables if needed? 
    // No, these are new independent tables.

    console.log('Phase 2 tables created: user_custom_roles, marriages');
}
