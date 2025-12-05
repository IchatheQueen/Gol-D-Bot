import { Message, Client, EmbedBuilder } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';
import { getInventoryItem, removeInventoryItem } from '../../database/inventory';

// Cooldowns refreshed by Beer
const beerRefreshCooldowns = [
    'shoot_pistol', 'shoot_rifle', 'shoot_crossbow', 'shoot_speaker', 'shoot_flamethrower',
    'hex', 'boost', 'beatup', 'pet', 'dispense', 'steal', 'decondition'
];

const command: Command = {
    name: 'drink',
    description: 'Drink a beer to refresh cooldowns',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;

        // Check cooldown (30m)
        const cooldownKey = 'drink';
        const cooldownTime = 30 * 60 * 1000;
        const cooldownCheck = await db.execute({
            sql: 'SELECT * FROM cooldowns WHERE user_id = ? AND command = ?',
            args: [userId, cooldownKey]
        });
        const cooldown = cooldownCheck.rows[0] as any;

        if (cooldown) {
            const timeLeft = Number(cooldown.timestamp) + cooldownTime - Date.now();
            if (timeLeft > 0) {
                const minutes = Math.ceil(timeLeft / (1000 * 60));
                message.reply(`You need to wait **${minutes}m** before drinking again!`);
                return;
            }
        }

        // Check if user has Beer
        const beerAmount = await getInventoryItem(userId, '2');
        if (beerAmount < 1n) {
            message.reply('You don\'t have any 🍺 **Beer**! Buy some from the shop (`~shop`).');
            return;
        }

        // Consume Beer
        await removeInventoryItem(userId, '2', 1n);

        // Refresh cooldowns
        for (const cd of beerRefreshCooldowns) {
            await db.execute({
                sql: 'DELETE FROM cooldowns WHERE user_id = ? AND command = ?',
                args: [userId, cd]
            });
        }

        // Set drink cooldown
        await db.execute({
            sql: 'INSERT OR REPLACE INTO cooldowns (user_id, command, timestamp) VALUES (?, ?, ?)',
            args: [userId, cooldownKey, Date.now()]
        });

        const embed = new EmbedBuilder()
            .setTitle('🍺 Cheers!')
            .setDescription('You drank a **Beer** and refreshed your weapon cooldowns!')
            .setColor('#ffc107');

        message.reply({ embeds: [embed] });
    },
};

export default command;
