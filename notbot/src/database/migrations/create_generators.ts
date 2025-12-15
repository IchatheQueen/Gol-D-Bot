import db from '../db';

export async function run() {
    await db.execute(`
        CREATE TABLE IF NOT EXISTS generators (
            user_id TEXT PRIMARY KEY,
            level INTEGER DEFAULT 0,
            invested TEXT DEFAULT '0',
            points INTEGER DEFAULT 0, -- Credits/Points to spend on stats
            
            -- Upgradable Stats
            stat_potency INTEGER DEFAULT 1,
            stat_efficiency INTEGER DEFAULT 1,
            stat_health INTEGER DEFAULT 0,
            stat_hunger INTEGER DEFAULT 0,
            stat_thirst INTEGER DEFAULT 0,
            stat_energy INTEGER DEFAULT 0,
            stat_strength INTEGER DEFAULT 0,
            stat_agility INTEGER DEFAULT 0,
            stat_intellect INTEGER DEFAULT 0,
            stat_endurance INTEGER DEFAULT 0,
            stat_metabolism INTEGER DEFAULT 0,
            
            last_claim INTEGER DEFAULT 0
        )
    `);

    console.log('Generator table created.');
}
