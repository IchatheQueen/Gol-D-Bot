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

        // Set cooldown to exactly 10 minutes from now (or reduce to 10 mins)
        // Screenshot implies "reduced its feeding cooldown to 10 minutes"
        const tenMins = 10 * 60 * 1000;
        const newTimestamp = Date.now() - (60 * 60 * 1000) + tenMins; // Set so timestamp + 1h = now + 10m

        await db.execute({
            sql: 'UPDATE cooldowns SET timestamp = ? WHERE user_id = ? AND command = ?',
            args: [newTimestamp, userId, 'feed']
        });

        const displayName = message.guild?.members.cache.get(userId)?.displayName || message.author.username;
        const embed = {
            description: `${displayName} (@${message.author.username}) has pet their [Lvl ${pet.level}] Cat and reduced its feeding cooldown to 10 minutes`,
            color: 0x2b2d31
        };

        message.reply({ embeds: [embed] });
    },
};

export default command;
