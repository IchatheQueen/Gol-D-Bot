import db from './db';

/**
 * Default embed sidebar colour for users who have never run ~color.
 *
 * White, matching the `user_colors.color DEFAULT 16777215` already in the
 * schema. Reference screenshots show ~balance, ~adopt and ~shop with a teal
 * stripe but ~help with a white one, all for the same user — so teal is that
 * user's ~color preference, not the house default, and static embeds like
 * ~help use STATIC_EMBED_COLOR instead of the per-user value.
 *
 * These two are the only knobs for the house style — change them here, never
 * per command.
 */
export const DEFAULT_EMBED_COLOR = 0xffffff;

/** Sidebar for embeds that are not personalised (e.g. ~help). */
export const STATIC_EMBED_COLOR = 0xffffff;

/**
 * Colors are cached in memory because they are read on virtually every embed.
 * Populated once at startup by loadUserColors() and kept warm by setUserColor.
 */
const colorCache = new Map<string, number>();

export async function loadUserColors(): Promise<void> {
    try {
        const result = await db.execute('SELECT user_id, color FROM user_colors');
        colorCache.clear();
        for (const row of result.rows as any[]) {
            colorCache.set(row.user_id as string, Number(row.color));
        }
        console.log(`Loaded ${colorCache.size} user color preferences.`);
    } catch (e) {
        console.error('Failed to load user colors:', e);
    }
}

/**
 * Stays synchronous so the ~32 embed call sites need no changes. Falls back to
 * the house default for users who have never set one.
 */
export function getUserColor(userId: string): number {
    const color = colorCache.get(userId);
    return color === undefined ? DEFAULT_EMBED_COLOR : color;
}

export async function setUserColor(userId: string, color: number): Promise<void> {
    await db.execute({
        sql: 'INSERT OR REPLACE INTO user_colors (user_id, color) VALUES (?, ?)',
        args: [userId, color]
    });
    colorCache.set(userId, color);
}
