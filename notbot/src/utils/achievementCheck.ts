import { Client, TextChannel } from 'discord.js';
import db from '../database/db';
import { ACHIEVEMENTS } from '../data/achievements';

export async function checkAchievement(client: Client, userId: string, achievementId: string, channelId?: string) {
    const ach = ACHIEVEMENTS[achievementId];
    if (!ach) return;

    try {
        // Check if unlocked
        const check = await db.execute({
            sql: 'SELECT 1 FROM achievements WHERE user_id = ? AND achievement_id = ?',
            args: [userId, achievementId]
        });

        if (check.rows.length > 0) return; // Already unlocked

        // Unlock
        await db.execute({
            sql: 'INSERT INTO achievements (user_id, achievement_id, unlocked_at) VALUES (?, ?, ?)',
            args: [userId, achievementId, Date.now()]
        });

        // Notify
        if (channelId) {
            const channel = client.channels.cache.get(channelId) as TextChannel;
            if (channel) {
                channel.send(`🏆 <@${userId}> has unlocked the achievement: **${ach.emoji} ${ach.name}**!`);
            }
        }
    } catch (e) {
        console.error('Error checking achievement:', e);
    }
}
