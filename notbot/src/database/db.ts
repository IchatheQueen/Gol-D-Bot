import { createClient } from '@libsql/client';

// Turso connection - uses environment variables
// TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set
const db = createClient({
    url: process.env.TURSO_DATABASE_URL || 'file:./slotbot.db',  // Falls back to local file for dev
    authToken: process.env.TURSO_AUTH_TOKEN,
});

// Initialize tables
export async function initDatabase() {
    await db.execute(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            balance TEXT DEFAULT '0',
            vault TEXT DEFAULT '0',
            pills INTEGER DEFAULT 0,
            credits TEXT DEFAULT '0',
            selected_weapon TEXT DEFAULT 'pistol',
            selected_arrow TEXT DEFAULT 'arrow_normal'
        )
    `);

    await db.execute(`
        CREATE TABLE IF NOT EXISTS inventory (
            user_id TEXT,
            item_id TEXT,
            amount TEXT DEFAULT '0',
            PRIMARY KEY (user_id, item_id)
        )
    `);

    await db.execute(`
        CREATE TABLE IF NOT EXISTS cooldowns (
            user_id TEXT,
            command TEXT,
            timestamp INTEGER,
            PRIMARY KEY (user_id, command)
        )
    `);

    await db.execute(`
        CREATE TABLE IF NOT EXISTS pets (
            user_id TEXT PRIMARY KEY,
            name TEXT DEFAULT 'Cat',
            health INTEGER DEFAULT 1000,
            max_health INTEGER DEFAULT 1000,
            hunger INTEGER DEFAULT 100,
            thirst INTEGER DEFAULT 100,
            energy INTEGER DEFAULT 100,
            happiness INTEGER DEFAULT 100,
            level INTEGER DEFAULT 1,
            experience INTEGER DEFAULT 0,
            credits INTEGER DEFAULT 0,
            strength INTEGER DEFAULT 1,
            agility INTEGER DEFAULT 1,
            intellect INTEGER DEFAULT 1,
            endurance INTEGER DEFAULT 1,
            metabolism INTEGER DEFAULT 1,
            protection INTEGER DEFAULT 0,
            target_item TEXT DEFAULT 'balance',
            is_attacking INTEGER DEFAULT 0
        )
    `);

    await db.execute(`
        CREATE TABLE IF NOT EXISTS stuns (
            user_id TEXT PRIMARY KEY,
            expires_at INTEGER,
            reason TEXT,
            issued_by TEXT
        )
    `);

    await db.execute(`
        CREATE TABLE IF NOT EXISTS blacklist (
            user_id TEXT PRIMARY KEY,
            reason TEXT,
            timestamp INTEGER
        )
    `);

    await db.execute(`
        CREATE TABLE IF NOT EXISTS drug_effects (
            user_id TEXT,
            drug_type TEXT,
            expires_at INTEGER,
            PRIMARY KEY (user_id, drug_type)
        )
    `);

    await db.execute(`
        CREATE TABLE IF NOT EXISTS stocks (
            user_id TEXT,
            stock_type INTEGER,
            shares TEXT DEFAULT '0',
            PRIMARY KEY (user_id, stock_type)
        )
    `);

    await db.execute(`
        CREATE TABLE IF NOT EXISTS user_colors (
            user_id TEXT PRIMARY KEY,
            color INTEGER DEFAULT 16777215
        )
    `);

    await db.execute(`
        CREATE TABLE IF NOT EXISTS wallet_drops (
            channel_id TEXT PRIMARY KEY,
            amount TEXT,
            timestamp INTEGER,
            claimed_by TEXT
        )
    `);

    await db.execute(`
        CREATE TABLE IF NOT EXISTS emoji_overrides (
            key TEXT PRIMARY KEY,
            emoji TEXT
        )
    `);

    console.log('Database tables initialized!');
}

export default db;
