import { Message, Client, EmbedBuilder } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';

const command: Command = {
    name: 'bio',
    description: 'Set your personal bio',
    execute: async (message: Message, args: string[], client: Client) => {
        if (message.author.id !== '1331780893995565148') {
            return;
        }
        const bio = args.join(' ');
        if (!bio) {
            message.reply('Usage: ~bio <your bio text>');
            return;
        }

        if (bio.length > 200) {
            message.reply('Bio must be 200 characters or less.');
            return;
        }

        await db.execute({
            sql: 'UPDATE users SET bio = ? WHERE id = ?',
            args: [bio, message.author.id]
        });

        message.reply('Successfully updated your bio! Enjoy :3');
    },
};

export default command;
