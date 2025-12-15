import db from '../db';

export async function run() {
    try {
        await db.execute('ALTER TABLE users ADD COLUMN is_premium INTEGER DEFAULT 0');
        console.log('Added is_premium column to users.');
    } catch (e: any) {
        if (e.message && e.message.includes('duplicate column name')) {
            // Ignore
        } else {
            console.error('Error adding is_premium:', e);
        }
    }
}
