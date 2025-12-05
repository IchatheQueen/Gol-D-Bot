import { Message, Client } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';

const command: Command = {
    name: 'target',
    description: 'Select item to target when attacking',
    execute: async (message: Message, args: string[], client: Client) => {
        const item = args.join(' ');

        if (!item) {
            message.reply('Usage: ~target <item name>');
            return;
        }

        const petCheck = await db.execute({
            sql: 'SELECT * FROM pets WHERE user_id = ?',
            args: [message.author.id]
        });
        const pet = petCheck.rows[0] as any;

        if (!pet) {
            message.reply('You need a cat!');
            return;
        }

        await db.execute({
            sql: 'UPDATE pets SET target_item = ? WHERE user_id = ?',
            args: [item, message.author.id]
        });

        message.reply(`Your cat will now target **${item}** when attacking.`);
    },
};

export default command;
