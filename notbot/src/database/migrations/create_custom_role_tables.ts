import db from '../db';

export async function run() {
    // Custom Role Ownership (Alias -> Role ID -> Owner)
    await db.execute(`
        CREATE TABLE IF NOT EXISTS custom_role_ownership (
            alias TEXT PRIMARY KEY,
            role_id TEXT NOT NULL,
            owner_id TEXT NOT NULL
        )
    `);

    // Custom Role Access (Shared access to give role)
    await db.execute(`
        CREATE TABLE IF NOT EXISTS custom_role_access (
            alias TEXT NOT NULL,
            user_id TEXT NOT NULL,
            access_type TEXT NOT NULL, -- 'owner', 'co_owner', 'access'
            PRIMARY KEY (alias, user_id)
        )
    `);

    // Drop the old table if it was created (it might not have been run yet or we just ignore it)
    await db.execute(`DROP TABLE IF EXISTS user_custom_roles`);

    console.log('Custom Role tables created: custom_role_ownership, custom_role_access');
}
