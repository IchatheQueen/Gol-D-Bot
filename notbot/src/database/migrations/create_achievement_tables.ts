import db from '../db';

export async function run() {
    await db.execute(`
        CREATE TABLE IF NOT EXISTS achievements (
            user_id TEXT NOT NULL,
            achievement_id TEXT NOT NULL,
            unlocked_at INTEGER NOT NULL,
            PRIMARY KEY (user_id, achievement_id)
        )
    `);

    console.log('Achievement table created.');
}
