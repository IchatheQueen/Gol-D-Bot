import db from '../../database/db';
import { TableColumn } from 'bun:sqlite';

export async function run() {
    await db.execute(`
        CREATE TABLE IF NOT EXISTS recruits (
            owner_id TEXT NOT NULL,
            recruit_id TEXT NOT NULL,
            keyword TEXT NOT NULL,
            created_at INTEGER,
            PRIMARY KEY (owner_id, keyword)
        )
    `);
    console.log('Recruits table created');
}
