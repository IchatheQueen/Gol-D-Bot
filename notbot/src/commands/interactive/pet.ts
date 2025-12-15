import { Message, Client } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';

const command: Command = {
    name: 'pet',
    description: 'Pet your cat to reduce feed cooldown',
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

        // Check if feed is on cooldown
        const cooldownCheck = await db.execute({
            sql: 'SELECT * FROM cooldowns WHERE user_id = ? AND command = ?',
            args: [userId, 'feed']
        });
        const feedCooldown = cooldownCheck.rows[0] as any;

        if (!feedCooldown) {
            message.reply('Your cat doesn\'t need petting right now!');
            return;
        }

        const timeLeft = Number(feedCooldown.timestamp) + (30 * 60 * 1000) - Date.now(); // Assuming 30m base cooldown

        if (timeLeft <= 0) {
            message.reply('Feed cooldown already expired!');
            return;
        }

        // Reduce cooldown by 1/3
        const reduction = Math.floor(timeLeft / 3);
        const newTimestamp = Number(feedCooldown.timestamp) + reduction;

        await db.execute({
            sql: 'UPDATE cooldowns SET timestamp = ? WHERE user_id = ? AND command = ?',
            args: [newTimestamp, userId, 'feed']
        });

        const newTimeLeft = Math.ceil((Number(feedCooldown.timestamp) + (30 * 60 * 1000) - Date.now() - reduction) / 60000);

    },
};

export default command;
