import { Message, Client } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';

const command: Command = {
    name: 'feed',
    description: 'Feed your cat',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;

        // Get pet
        const petCheck = await db.execute({
            sql: 'SELECT * FROM pets WHERE user_id = ?',
            args: [userId]
        });
        const pet = petCheck.rows[0] as any;

        if (!pet) {
            message.reply('You don\'t have a cat!');
            return;
        }

        // Check cooldown (1-30 minutes based on metabolism)
        const cooldownCheck = await db.execute({
            sql: 'SELECT * FROM cooldowns WHERE user_id = ? AND command = ?',
            args: [userId, 'feed']
        });
        const cooldown = cooldownCheck.rows[0] as any;

        const cooldownMinutes = Math.max(1, 30 - pet.metabolism);

        if (cooldown) {
            const timeLeft = Number(cooldown.timestamp) + (cooldownMinutes * 60 * 1000) - Date.now();
            if (timeLeft > 0) {
                const minutes = Math.ceil(timeLeft / 60000);
                message.reply(`You can feed again in ${minutes} minute(s).`);
                return;
            }
        }

        const food = args[0]?.toLowerCase() || 'fish';

        // Different foods affect different stats
        let statChange = '';

        switch (food) {
            case 'fish':
            case 'f':
                // Restore hunger, slight health boost
                await db.execute({
                    sql: 'UPDATE pets SET hunger = 100, health = MIN(health + 50, max_health) WHERE user_id = ?',
                    args: [userId]
                });
                statChange = 'Hunger restored, health +50';
                break;
            case 'steak':
                await db.execute({
                    sql: 'UPDATE pets SET hunger = 100, strength = strength + 1 WHERE user_id = ?',
                    args: [userId]
                });
                statChange = 'Hunger restored, strength +1';
                break;
            case 'energy':
                await db.execute({
                    sql: 'UPDATE pets SET hunger = 100, energy = 100 WHERE user_id = ?',
                    args: [userId]
                });
                statChange = 'Hunger and energy restored';
                break;
            default:
                await db.execute({
                    sql: 'UPDATE pets SET hunger = 100 WHERE user_id = ?',
                    args: [userId]
                });
                statChange = 'Hunger restored';
        }

        // Set cooldown
        await db.execute({
            sql: 'INSERT OR REPLACE INTO cooldowns (user_id, command, timestamp) VALUES (?, ?, ?)',
            args: [userId, 'feed', Date.now()]
        });

        message.reply(`Fed your cat! ${statChange}`);
    },
};

export default command;
