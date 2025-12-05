import { Message, Client } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';

const command: Command = {
    name: 'retreat',
    description: 'Call your cat back from an attack',
    execute: async (message: Message, args: string[], client: Client) => {
        const petCheck = await db.execute({
            sql: 'SELECT * FROM pets WHERE user_id = ?',
            args: [message.author.id]
        });
        const pet = petCheck.rows[0] as any;

        if (!pet) {
            message.reply('You don\'t have a cat!');
            return;
        }

        if (!pet.is_attacking) {
            message.reply('Your cat is not currently attacking anyone.');
            return;
        }

        await db.execute({
            sql: 'UPDATE pets SET is_attacking = 0 WHERE user_id = ?',
            args: [message.author.id]
        });

        message.reply(`**${message.author.username}'s [Lvl ${pet.level}] ${pet.name}** has retreated from battle!`);
    },
};

export default command;
