import db from './db';

async function migrate() {
    try {
        await db.execute(`ALTER TABLE pets ADD COLUMN max_health INTEGER DEFAULT 1000;`);
        await db.execute(`ALTER TABLE pets ADD COLUMN thirst INTEGER DEFAULT 100;`);
        await db.execute(`ALTER TABLE pets ADD COLUMN energy INTEGER DEFAULT 100;`);
        await db.execute(`ALTER TABLE pets ADD COLUMN experience INTEGER DEFAULT 0;`);
        await db.execute(`ALTER TABLE pets ADD COLUMN credits INTEGER DEFAULT 0;`);
        await db.execute(`ALTER TABLE pets ADD COLUMN strength INTEGER DEFAULT 1;`);
        await db.execute(`ALTER TABLE pets ADD COLUMN agility INTEGER DEFAULT 1;`);
        await db.execute(`ALTER TABLE pets ADD COLUMN intellect INTEGER DEFAULT 1;`);
        await db.execute(`ALTER TABLE pets ADD COLUMN endurance INTEGER DEFAULT 1;`);
        await db.execute(`ALTER TABLE pets ADD COLUMN metabolism INTEGER DEFAULT 1;`);
        console.log('Migration successful');
    } catch (error) {
        console.log('Migration failed or columns already exist:', error);
    }
}

migrate();
