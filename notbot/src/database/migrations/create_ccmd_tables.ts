
import db from '../db';

async function migrate() {
    try {
        await db.execute(`
            CREATE TABLE IF NOT EXISTS custom_command_ownership (
                command_name TEXT PRIMARY KEY,
                owner_id TEXT NOT NULL
            )
        `);

        await db.execute(`
            CREATE TABLE IF NOT EXISTS custom_command_access (
                command_name TEXT,
                user_id TEXT,
                access_type TEXT, -- 'owner', 'co_owner', 'access'
                PRIMARY KEY (command_name, user_id)
            )
        `);

        console.log('Custom command ownership tables created successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    }
}

migrate();
