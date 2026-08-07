import db from './db';

export const DEFAULT_PREFIX = '~';

/**
 * Personal prefixes are consulted on every single message, so they are held in
 * memory and refreshed on write rather than queried in the hot path.
 */
const prefixCache = new Map<string, string>();

export async function loadUserPrefixes(): Promise<void> {
    try {
        const result = await db.execute(
            "SELECT user_id, personal_prefix FROM user_settings WHERE personal_prefix IS NOT NULL AND personal_prefix != ''"
        );
        prefixCache.clear();
        for (const row of result.rows as any[]) {
            prefixCache.set(row.user_id as string, row.personal_prefix as string);
        }
        console.log(`Loaded ${prefixCache.size} personal prefixes.`);
    } catch (e) {
        console.error('Failed to load personal prefixes:', e);
    }
}

/** The personal prefix for a user, or null if they use the default. */
export function getUserPrefix(userId: string): string | null {
    return prefixCache.get(userId) ?? null;
}

export function cachePrefix(userId: string, prefix: string | null): void {
    if (prefix) {
        prefixCache.set(userId, prefix);
    } else {
        prefixCache.delete(userId);
    }
}

/**
 * Resolves which prefix a message used. The default prefix always works, even
 * for users with a personal one, so nobody can lock themselves out.
 */
export function matchPrefix(userId: string, content: string): string | null {
    const personal = getUserPrefix(userId);
    if (personal && content.startsWith(personal)) return personal;
    if (content.startsWith(DEFAULT_PREFIX)) return DEFAULT_PREFIX;
    return null;
}
