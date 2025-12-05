import { Message, Client } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';

const command: Command = {
    name: 'decondition',
    description: 'Decondition a stat to get 1 Cat Credit back',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;

        // Get pet
        const petCheck = await db.execute({
            sql: 'SELECT * FROM pets WHERE user_id = ?',
            args: [userId]
        });
        const pet = petCheck.rows[0] as any;

        if (!pet) {
            message.reply('You don\'t have a cat! Use `~cat` to adopt one.');
            return;
        }

        // Check cooldown (30 minutes)
        const cooldownCheck = await db.execute({
            sql: 'SELECT * FROM cooldowns WHERE user_id = ? AND command = ?',
            args: [userId, 'decondition']
        });
        const cooldown = cooldownCheck.rows[0] as any;

        if (cooldown) {
            const timeLeft = Number(cooldown.timestamp) + (30 * 60 * 1000) - Date.now();
            if (timeLeft > 0) {
                const minutes = Math.ceil(timeLeft / 60000);
                message.reply(`You can use this command again in ${minutes} minute(s).`);
                return;
            }
        }

        const statName = args[0]?.toLowerCase();
        const validStats = ['strength', 'agility', 'intellect', 'endurance', 'metabolism'];

        if (!validStats.includes(statName)) {
            message.reply('Invalid stat! Use: strength, agility, intellect, endurance, or metabolism');
            return;
        }

        const currentValue = pet[statName];

        if (currentValue <= 1) {
            message.reply(`Your cat's ${statName} is already at minimum!`);
            return;
        }

        // Decondition: reduce stat by 1, gain 1 credit
        await db.execute({
            sql: `UPDATE pets SET ${statName} = ${statName} - 1, credits = credits + 1 WHERE user_id = ?`,
            args: [userId]
        });

        // Set cooldown
        await db.execute({
            sql: 'INSERT OR REPLACE INTO cooldowns (user_id, command, timestamp) VALUES (?, ?, ?)',
            args: [userId, 'decondition', Date.now()]
        });

        message.reply(`Deconditioned ${statName}! You gained 🍥 1 Cat Credit.`);
    },
};

export default command;
