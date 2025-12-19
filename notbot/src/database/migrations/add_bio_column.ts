import db from '../db';

export async function run() {
    try {
        await db.execute('ALTER TABLE users ADD COLUMN bio TEXT DEFAULT "No bio set."');
        console.log('Added bio column to users table');
    } catch (e) {
        // Likely already exists
    }
}
