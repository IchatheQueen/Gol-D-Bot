import db from '../db';

export async function run() {
    // DROP existing tables to ensure schema update during dev if needed
    // In production we usually don't drop, but since it's breaking anyway:
    // await db.execute('DROP TABLE IF EXISTS recruitment_codes');
    // await db.execute('DROP TABLE IF EXISTS recruitments');

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

    // Recruits (Permanent links)
    // Standardizing on 'recruits' table used by recruit.ts and execute.ts
    await db.execute(`
        CREATE TABLE IF NOT EXISTS recruits (
            owner_id TEXT NOT NULL,
            recruit_id TEXT NOT NULL,
            keyword TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            PRIMARY KEY (owner_id, recruit_id)
        )
    `);

    console.log('Recruit tables created: recruitment_codes, recruits');
}
