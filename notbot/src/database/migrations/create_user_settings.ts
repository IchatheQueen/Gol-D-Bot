import db from '../db';

export async function run() {
    await db.execute(`
        CREATE TABLE IF NOT EXISTS user_settings (
            user_id TEXT PRIMARY KEY,
            dnd INTEGER DEFAULT 0,
            shiny_cat INTEGER DEFAULT 0,
            premium_gifting INTEGER DEFAULT 1,
            recruit_requests INTEGER DEFAULT 1,
            lb_anon INTEGER DEFAULT 0
        )
    `);
    console.log('Created user_settings table');
}
