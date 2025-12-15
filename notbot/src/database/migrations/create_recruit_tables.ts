import db from '../db';

export async function run() {
    // DROP existing tables to ensure schema update during dev
    await db.execute('DROP TABLE IF EXISTS recruitment_codes');
    await db.execute('DROP TABLE IF EXISTS recruitments');

    // Recruitment Codes (Short-lived codes for linking)
    await db.execute(`
        CREATE TABLE IF NOT EXISTS recruitment_codes (
            code TEXT PRIMARY KEY,
            recruiter_id TEXT NOT NULL,
            target_id TEXT NOT NULL,
            tag TEXT NOT NULL,
            expires_at INTEGER NOT NULL
        )
    `);

    // Recruitments (Permanent links)
    await db.execute(`
        CREATE TABLE IF NOT EXISTS recruitments (
            recruiter_id TEXT NOT NULL,
            target_id TEXT NOT NULL,
            tag TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            PRIMARY KEY (recruiter_id, tag)
        )
    `);

    console.log('Recruit tables created: recruitment_codes, recruitments');
}
