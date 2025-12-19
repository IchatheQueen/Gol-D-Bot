import { Message, Client, EmbedBuilder } from 'discord.js';
import { Command } from '../../handlers/commandHandler';
import { getInventoryItem, removeInventoryItem } from '../../database/inventory';
import db from '../../database/db';

const command: Command = {
    name: 'smoke',
    description: 'Smoke some weed',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;

        // Check cooldown (2 hours)
        const cooldownTime = 2 * 60 * 60 * 1000;
        const cooldownCheck = await db.execute({
            sql: 'SELECT timestamp FROM cooldowns WHERE user_id = ? AND command = ?',
            args: [userId, 'smoke']
        });
        const cooldownRow = cooldownCheck.rows[0] as any;

        if (cooldownRow) {
            const timeLeft = Number(cooldownRow.timestamp) + cooldownTime - Date.now();
            if (timeLeft > 0) {
                const hours = Math.floor(timeLeft / (1000 * 60 * 60));
                const minutes = Math.ceil((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
                message.reply(`You must wait another ${hours} hours and ${minutes} minutes before smoking again!`);
                return;
            }
        }

        await removeInventoryItem(userId, 'weed', 1n);

        // Set cooldown
        await db.execute({
            sql: 'INSERT OR REPLACE INTO cooldowns (user_id, command, timestamp) VALUES (?, ?, ?)',
            args: [userId, 'smoke', Date.now()]
        });

        const displayName = message.guild?.members.cache.get(userId)?.displayName || message.author.username;
        const embed = new EmbedBuilder()
            .setDescription(`${displayName} (@${message.author.username}) has rolled up a blunt of 🌿 and smoked it`)
            .setColor('#2b2d31');

        message.reply({ embeds: [embed] });
    },
};

export default command;
