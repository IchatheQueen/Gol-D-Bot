import db from './db';

async function migrate() {
    try {
        await db.execute(`ALTER TABLE users ADD COLUMN pills INTEGER DEFAULT 0;`);
        await db.execute(`ALTER TABLE pets ADD COLUMN protection INTEGER DEFAULT 0;`);
        await db.execute(`ALTER TABLE pets ADD COLUMN target_item TEXT DEFAULT NULL;`);
        console.log('Migration successful');
    } catch (error) {
        console.log('Migration failed or columns already exist:', error);
    }
}

migrate();
