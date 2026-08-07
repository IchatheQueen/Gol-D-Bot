import db from '../db';

/**
 * Adds the two settings that exist in SlotBot's ~settings but were missing
 * here: a per-user command prefix, and the LSD vault-withdraw toggle.
 */
export async function run() {
    const columns = [
        "ALTER TABLE user_settings ADD COLUMN personal_prefix TEXT",
        "ALTER TABLE user_settings ADD COLUMN lsd_vault INTEGER DEFAULT 0",
    ];

    for (const sql of columns) {
        try {
            await db.execute(sql);
        } catch {
            // Column already exists.
        }
    }
}
