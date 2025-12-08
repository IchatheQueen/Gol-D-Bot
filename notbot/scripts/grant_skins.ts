import dotenv from 'dotenv';
dotenv.config();
import db from '../src/database/db';

async function run() {
    const userId = '1331780893995565148';
    const skinIds = [1, 2, 69];

    for (const id of skinIds) {
        try {
            await db.execute({
                sql: 'INSERT OR IGNORE INTO user_skins (user_id, skin_id) VALUES (?, ?)',
                args: [userId, id]
            });
            console.log(`Granted skin ${id} to ${userId}`);
        } catch (e) {
            console.error(`Failed to grant skin ${id}:`, e);
        }
    }
}

run();
