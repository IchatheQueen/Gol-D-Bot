import { Message, Client } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';
import { getInventoryItem } from '../../database/inventory';

const command: Command = {
    name: 'dispense',
    description: 'Collect pills from your Pill Generator',
    execute: async (message: Message, args: string[], client: Client) => {
        // Check if user has a Pill Generator
        const generatorAmount = await getInventoryItem(message.author.id, 'pill_generator');

        if (generatorAmount <= 0n) {
            message.reply('You do not own a Pill Generator!');
            return;
        }

        // Logic for dispensing (simplified: just give 1 pill per command for now, or cooldown based)
        // Screenshot shows "collected Pill 1 from their Pill Generator"

        await db.execute({
            sql: 'UPDATE users SET pills = pills + 1 WHERE id = ?',
            args: [message.author.id]
        });

        message.reply(`${message.author.username} has collected 💊 1 from their 🗜️`);
    },
};

export default command;
