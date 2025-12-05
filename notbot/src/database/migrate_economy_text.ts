import db from './db';

console.log('Migrating economy columns to TEXT...');

const migrate = async () => {
    try {
        await db.execute('BEGIN TRANSACTION');

        // 1. Rename users to users_old
        await db.execute('ALTER TABLE users RENAME TO users_old');

        // 2. Create new users table with TEXT for economy fields
        await db.execute(`
            CREATE TABLE users (
                id TEXT PRIMARY KEY,
                balance TEXT DEFAULT '0',
                vault TEXT DEFAULT '0',
                pills INTEGER DEFAULT 0,
                credits TEXT DEFAULT '0',
                selected_weapon TEXT DEFAULT 'pistol',
                selected_arrow TEXT DEFAULT 'arrow_normal',
                color_preference TEXT DEFAULT '#39C5BB'
            )
        `);

        // 3. Copy data
        // We cast INTEGER to TEXT for existing columns
        // 'credits' didn't exist, so we default it to '0' (handled by CREATE TABLE default, or we can explicitly set it)
        // We don't select 'credits' from users_old because it doesn't exist
        await db.execute(`
            INSERT INTO users (id, balance, vault, pills, selected_weapon, selected_arrow, color_preference)
            SELECT id, CAST(balance AS TEXT), CAST(vault AS TEXT), pills, selected_weapon, selected_arrow, color_preference
            FROM users_old
        `);

        // 4. Drop old table
        await db.execute('DROP TABLE users_old');

        await db.execute('COMMIT');
        console.log('Migration successful!');
    } catch (error) {
        console.error('Migration failed:', error);
        await db.execute('ROLLBACK');
    }
};

migrate();
