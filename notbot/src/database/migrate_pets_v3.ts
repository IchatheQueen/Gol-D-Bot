import db from './db';

async function migrate() {
    try {
        await db.execute(`ALTER TABLE pets ADD COLUMN is_attacking INTEGER DEFAULT 0;`);
        // Update existing target_item to default 'balance' if null
        await db.execute(`UPDATE pets SET target_item = 'balance' WHERE target_item IS NULL;`);
        console.log('Migration successful');
    } catch (error) {
        console.log('Migration failed or columns already exist:', error);
    }
}

migrate();
