import db from '../db';

export async function run() {
    try {
        await db.execute('ALTER TABLE pets ADD COLUMN last_fed INTEGER DEFAULT 0');
        console.log('Added last_fed column to pets table.');
    } catch (e) {
        // Column likely exists
        console.log('last_fed column likely exists in pets table.');
    }
}
