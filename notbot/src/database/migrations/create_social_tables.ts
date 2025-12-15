
import db from '../db';

export async function run() {
    // Recruits
    await db.execute(`
        CREATE TABLE IF NOT EXISTS recruits (
            owner_id TEXT,
            recruit_id TEXT,
            keyword TEXT,
            created_at INTEGER,
            PRIMARY KEY (owner_id, recruit_id)
        )
    `);

    // Marriages
    await db.execute(`
        CREATE TABLE IF NOT EXISTS marriages (
            user1_id TEXT,
            user2_id TEXT,
            level INTEGER DEFAULT 1,
            timestamp INTEGER,
            PRIMARY KEY (user1_id, user2_id)
        )
    `);

    // Clans
    await db.execute(`
        CREATE TABLE IF NOT EXISTS clans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE,
            owner_id TEXT,
            level INTEGER DEFAULT 1,
            created_at INTEGER
        )
    `);

    await db.execute(`
        CREATE TABLE IF NOT EXISTS clan_members (
            clan_id INTEGER,
            user_id TEXT PRIMARY KEY,
            role TEXT DEFAULT 'member', -- member, elder, co-leader, leader
            joined_at INTEGER
        )
    `);

    console.log('Social tables (recruits, marriages, clans) created.');
}
