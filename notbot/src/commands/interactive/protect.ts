import { Message, Client } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';

const command: Command = {
    name: 'protect',
    description: 'Toggle cat protection',
    execute: async (message: Message, args: string[], client: Client) => {
        const petCheck = await db.execute({
            sql: 'SELECT * FROM pets WHERE user_id = ?',
            args: [message.author.id]
        });
        const pet = petCheck.rows[0] as any;

        if (!pet) {
            message.reply('You need a cat!');
            return;
        }

        const newStatus = pet.protection ? 0 : 1;
        await db.execute({
            sql: 'UPDATE pets SET protection = ? WHERE user_id = ?',
            args: [newStatus, message.author.id]
        });

        message.reply(`Protection is now **${newStatus ? 'ON' : 'OFF'}**.`);
    },
};

export default command;
