import { Client, EmbedBuilder } from 'discord.js';
import db from '../database/db';

/**
 * Send a DM notification to a user with the same message shown in channel.
 * Respects the `dnd` user setting, which previously toggled nothing.
 */
export async function sendCombatDM(
    client: Client,
    userId: string,
    message: string,
    color: number = 0x39C5BB
): Promise<boolean> {
    try {
        const settings = await db.execute({
            sql: 'SELECT dnd FROM user_settings WHERE user_id = ?',
            args: [userId]
        });
        const row = settings.rows[0] as any;
        if (row && Number(row.dnd) === 1) return false;
    } catch {
        // Settings unavailable — fall through and notify as before.
    }

    try {
        const user = await client.users.fetch(userId);
        if (user) {
            const embed = new EmbedBuilder()
                .setDescription(message)
                .setColor(color);

            await user.send({ embeds: [embed] });
            return true;
        }
    } catch (error) {
        // User has DMs disabled or other error - silently fail
    }
    return false;
}
