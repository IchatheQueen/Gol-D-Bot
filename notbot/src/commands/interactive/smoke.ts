import { Message, Client, EmbedBuilder } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';
import { getInventoryItem, removeInventoryItem } from '../../database/inventory';

// Cooldowns refreshed by Weed
const weedRefreshCooldowns = [
    'shoot_pistol', 'shoot_rifle', 'shoot_crossbow', 'shoot_speaker', 'shoot_flamethrower',
    'hex', 'boost', 'beatup', 'pet', 'dispense', 'steal', 'decondition', 'drink'
];

const command: Command = {
    name: 'smoke',
    description: 'Smoke weed to refresh cooldowns',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;

        // Check cooldown (2h)
        const cooldownKey = 'smoke';
        const cooldownTime = 2 * 60 * 60 * 1000;
        const cooldownCheck = await db.execute({
            sql: 'SELECT * FROM cooldowns WHERE user_id = ? AND command = ?',
            args: [userId, cooldownKey]
        });
        const cooldown = cooldownCheck.rows[0] as any;

        if (cooldown) {
            const timeLeft = Number(cooldown.timestamp) + cooldownTime - Date.now();
            if (timeLeft > 0) {
                const hours = Math.floor(timeLeft / (1000 * 60 * 60));
                const minutes = Math.ceil((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
                message.reply(`You need to wait **${hours}h ${minutes}m** before smoking again!`);
                return;
            }
        }

        // Check if user has Weed (BM ID 1)
        const weedAmount = await getInventoryItem(userId, '1');
        if (weedAmount < 1n) {
            message.reply('You don\'t have any 🌿 **Weed**! Buy some from the Black Market (`~bm`).');
            return;
        }

        // Consume Weed
        await removeInventoryItem(userId, '1', 1n);

        // Refresh cooldowns
        for (const cd of weedRefreshCooldowns) {
            await db.execute({
                sql: 'DELETE FROM cooldowns WHERE user_id = ? AND command = ?',
                args: [userId, cd]
            });
        }

        // Set smoke cooldown
        await db.execute({
            sql: 'INSERT OR REPLACE INTO cooldowns (user_id, command, timestamp) VALUES (?, ?, ?)',
            args: [userId, cooldownKey, Date.now()]
        });

        const embed = new EmbedBuilder()
            .setTitle('🌿 Puff Puff')
            .setDescription('You smoked some **Weed** and refreshed your cooldowns!')
            .setColor('#00ff00');

        message.reply({ embeds: [embed] });
    },
};

export default command;
