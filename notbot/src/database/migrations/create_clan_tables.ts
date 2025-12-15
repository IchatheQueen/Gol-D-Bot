import db from '../db';

export async function run() {
    // Clans
    await db.execute(`
        CREATE TABLE IF NOT EXISTS clans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            owner_id TEXT NOT NULL,
            description TEXT DEFAULT 'No description set.',
            balance TEXT DEFAULT '0',
            level INTEGER DEFAULT 1,
            created_at INTEGER NOT NULL
        )
    `);

    // Clan Members
    await db.execute(`
        CREATE TABLE IF NOT EXISTS clan_members (
            clan_id INTEGER NOT NULL,
            user_id TEXT NOT NULL,
            role TEXT DEFAULT 'member', -- 'leader', 'officer', 'member'
            joined_at INTEGER NOT NULL,
            PRIMARY KEY (clan_id, user_id)
        )
    `);

    // Clan Invites (Short-lived)
    await db.execute(`
        CREATE TABLE IF NOT EXISTS clan_invites (
            clan_id INTEGER NOT NULL,
            user_id TEXT NOT NULL,
            invited_by TEXT NOT NULL,
            expires_at INTEGER NOT NULL,
            PRIMARY KEY (clan_id, user_id)
        )
    `);

    console.log('Clan tables created: clans, clan_members, clan_invites');
}
