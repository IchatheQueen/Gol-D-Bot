import { Client } from 'discord.js';
import db from '../database/db';

/** Shown in place of the username when a user has `~settings lb` enabled. */
export const HIDDEN_NAME = '[User Hidden]';

/**
 * Ranks 1-3 get medals, everything below gets its number. Kept here so every
 * leaderboard in the bot renders positions the same way.
 */
export function rankPrefix(index: number): string {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
}

/**
 * Resolves display names for a set of leaderboard entries in one pass.
 *
 * Users with the LB Anon setting are never fetched from Discord — they render
 * as `[User Hidden]` regardless of where they place. The opt-out is read in a
 * single query so a top-10 doesn't turn into ten round trips.
 */
export async function resolveLeaderboardNames(client: Client, userIds: string[]): Promise<Map<string, string>> {
    const names = new Map<string, string>();
    if (userIds.length === 0) return names;

    const placeholders = userIds.map(() => '?').join(',');
    const hiddenRes = await db.execute({
        sql: `SELECT user_id FROM user_settings WHERE lb_anon = 1 AND user_id IN (${placeholders})`,
        args: userIds
    });
    const hidden = new Set(hiddenRes.rows.map((r: any) => String(r.user_id)));

    for (const id of userIds) {
        if (hidden.has(id)) {
            names.set(id, HIDDEN_NAME);
            continue;
        }
        const user = await client.users.fetch(id).catch(() => null);
        names.set(id, user ? user.username : id);
    }

    return names;
}
