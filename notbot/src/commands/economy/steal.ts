import { Message, Client } from 'discord.js';
import db from '../../database/db';
import { addInventoryItem } from '../../database/inventory';
import { Command } from '../../handlers/commandHandler';
import { EmbedBuilder } from 'discord.js';

const command: Command = {
    name: 'steal',
    description: 'Steal a briefcase from another user',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;

        // Check 2 hour cooldown
        const cooldownTime = 2 * 60 * 60 * 1000; // 2 hours
        const cooldownCheck = await db.execute({
            sql: 'SELECT timestamp FROM cooldowns WHERE user_id = ? AND command = ?',
            args: [userId, 'steal']
        });

        if (cooldownCheck.rows.length > 0) {
            const row = cooldownCheck.rows[0] as any;
            const timeLeft = Number(row.timestamp) + cooldownTime - Date.now();
            if (timeLeft > 0) {
                const hours = Math.floor(timeLeft / (1000 * 60 * 60));
                const minutes = Math.ceil((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
                message.reply(`⚠️ You need to lay low! If you try to steal again now, you'll get caught! Wait **${hours}h ${minutes}m**.`);
                return;
            }
        }

        const success = Math.random() < 0.4; // 40% chance

        if (success) {
            // Weighted random for briefcase type
            const rand = Math.random();
            let type = 'employee';

            if (rand < 0.05) type = 'nitro';       // 5% chance for Nitro
            else if (rand < 0.15) type = 'ender';  // 10%
            else if (rand < 0.35) type = 'richkid'; // 20%
            else if (rand < 0.60) type = 'oldlady'; // 25%
            else type = 'employee';                // 40%

            const itemId = `${type}_briefcase`;
            await addInventoryItem(message.author.id, itemId, 1n);

            // Descriptions
            let typeName = `${type} briefcase`;
            let emoji = '💼';

            if (type === 'oldlady') {
                typeName = "snobby old lady's briefcase";
                emoji = '👝';
            } else if (type === 'ender') {
                typeName = "EnderMomandNate briefcase";
                emoji = '👛';
            } else if (type === 'nitro') {
                typeName = "nitro briefcase";
                emoji = '🎒';
            } else if (type === 'richkid') {
                typeName = "rich kid's briefcase";
                emoji = '👜';
            } else if (type === 'employee') {
                typeName = "employee's briefcase";
                emoji = '💼';
            }

            const embed = new EmbedBuilder()
                .setDescription(`${message.author} has stolen a ${typeName} ${emoji}! \`~briefcases\``)
                .setColor('#2F3136'); // Dark gray/black from screenshot

            message.reply({ embeds: [embed] });
        } else {
            message.reply('You tried to steal a briefcase but got caught! You ran away empty-handed.');
        }

        // Set cooldown
        await db.execute({
            sql: 'INSERT OR REPLACE INTO cooldowns (user_id, command, timestamp) VALUES (?, ?, ?)',
            args: [userId, 'steal', Date.now()]
        });
    },
};

export default command;
