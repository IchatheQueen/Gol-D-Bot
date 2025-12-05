import { Client, EmbedBuilder } from 'discord.js';

/**
 * Send a DM notification to a user with the same message shown in channel
 */
export async function sendCombatDM(
    client: Client,
    userId: string,
    message: string,
    color: number = 0x39C5BB
): Promise<boolean> {
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
