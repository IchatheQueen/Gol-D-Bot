import { Message, Client, EmbedBuilder } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';
import { ACHIEVEMENTS } from '../../data/achievements';
import { getUserColor } from '../../database/userColor';

const command: Command = {
    name: 'achievements',
    description: 'View your unlocked achievements',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;

        // Get unlocked
        const result = await db.execute({
            sql: 'SELECT achievement_id, unlocked_at FROM achievements WHERE user_id = ?',
            args: [userId]
        });

        const unlockedIds = new Set(result.rows.map(row => row.achievement_id));
        const allAchievements = Object.values(ACHIEVEMENTS);
        const unlockedCount = unlockedIds.size;
        const totalCount = allAchievements.length;

        const embed = new EmbedBuilder()
            .setTitle(`🏆 Achievements (${unlockedCount}/${totalCount})`)
            .setColor(getUserColor(userId))
            .setTimestamp();

        let description = '';

        for (const ach of allAchievements) {
            const isUnlocked = unlockedIds.has(ach.id);
            if (isUnlocked) {
                description += `**${ach.emoji} ${ach.name}**\n${ach.description}\n\n`;
            } else if (!ach.hidden) {
                description += `**🔒 ${ach.name}**\n${ach.description}\n\n`;
            } else {
                description += `**🔒 ???**\nHidden Achievement\n\n`;
            }
        }

        embed.setDescription(description);
        message.reply({ embeds: [embed] });
    }
};

export default command;
