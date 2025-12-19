import db from '../database/db';

const OWNER_ID = '1331780893995565148';

/**
 * Check if a user is an admin or the owner
 */
export async function isAdmin(userId: string): Promise<boolean> {
    if (userId === OWNER_ID) return true;

    const result = await db.execute({
        sql: 'SELECT 1 FROM admins WHERE user_id = ?',
        args: [userId]
    });

    return result.rows.length > 0;
}

/**
 * Get all admin IDs
 */
export async function getAdmins(): Promise<string[]> {
    const result = await db.execute('SELECT user_id FROM admins');
    return result.rows.map(row => row.user_id as string);
}

/**
 * Add an admin
 */
export async function addAdmin(userId: string): Promise<boolean> {
    try {
        await db.execute({
            sql: 'INSERT OR IGNORE INTO admins (user_id) VALUES (?)',
            args: [userId]
        });
        return true;
    } catch {
        return false;
    }
}

/**
 * Remove an admin
 */
export async function removeAdmin(userId: string): Promise<boolean> {
    if (userId === OWNER_ID) return false; // Cannot remove owner

    try {
        await db.execute({
            sql: 'DELETE FROM admins WHERE user_id = ?',
            args: [userId]
        });
        return true;
    } catch {
        return false;
    }
}
