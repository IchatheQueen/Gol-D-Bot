import db from '../db';

/**
 * Cosmetics earned from seasonal events (badges, titles, weapon skins).
 *
 * Kept out of `inventory` because these are one-per-account and never counted,
 * so a quantity column would only ever hold 1 and invite double-grants.
 */
export async function run() {
    try {
        await db.execute(`
            CREATE TABLE IF NOT EXISTS user_cosmetics (
                user_id TEXT,
                cosmetic_id TEXT,
                type TEXT,
                source TEXT,
                obtained_at INTEGER,
                PRIMARY KEY (user_id, cosmetic_id)
            )
        `);
        console.log('Created user_cosmetics table');
    } catch (e) {
        console.error('Failed to create user_cosmetics table:', e);
    }

    // Equipped cosmetics hang off user_settings rather than user_cosmetics:
    // only one badge and one title are worn at a time, so they are properties
    // of the user, not of an owned row.
    for (const sql of [
        'ALTER TABLE user_settings ADD COLUMN equipped_badge TEXT',
        'ALTER TABLE user_settings ADD COLUMN equipped_title TEXT',
    ]) {
        try {
            await db.execute(sql);
        } catch {
            // Column already exists.
        }
    }
}
