
import db from '../db';

async function migrate() {
    console.log('Migrating generators table...');
    try {
        await db.execute(`
            CREATE TABLE IF NOT EXISTS generators (
                user_id TEXT PRIMARY KEY,
                level INTEGER DEFAULT 1,
                invested TEXT DEFAULT '0',
                credits INTEGER DEFAULT 0,
                potency_level INTEGER DEFAULT 1,
                efficiency_level INTEGER DEFAULT 1,
                health_level INTEGER DEFAULT 1,
                hunger_level INTEGER DEFAULT 1,
                thirst_level INTEGER DEFAULT 1,
                energy_level INTEGER DEFAULT 1,
                strength_level INTEGER DEFAULT 1,
                agility_level INTEGER DEFAULT 1,
                intellect_level INTEGER DEFAULT 1,
                endurance_level INTEGER DEFAULT 1
            )
        `);
        console.log('Generators table created successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    }
}

migrate();
