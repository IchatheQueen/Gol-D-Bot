import { Message, Client } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';

const command: Command = {
    name: 'train',
    description: 'Improve your cat\'s stats',
    execute: async (message: Message, args: string[], client: Client) => {
        const type = args[0]?.toLowerCase();
        const amount = parseInt(args[1]);

        const validStats = ['strength', 'agility', 'intellect', 'endurance', 'metabolism'];

        if (!type || !validStats.includes(type) || !amount || amount <= 0) {
            message.reply(`Usage: ~train <type> <amount>\nValid types: ${validStats.join(', ')}`);
            return;
        }

        const petCheck = await db.execute({
            sql: 'SELECT * FROM pets WHERE user_id = ?',
            args: [message.author.id]
        });
        const pet = petCheck.rows[0] as any;

        if (!pet) {
            message.reply('You need a cat to train!');
            return;
        }

        if (pet.credits < amount) {
            message.reply(`You don't have enough credits! You have ${pet.credits}.`);
            return;
        }

        await db.execute({
            sql: `UPDATE pets SET ${type} = ${type} + ?, credits = credits - ? WHERE user_id = ?`,
            args: [amount, amount, message.author.id]
        });

        message.reply(`You trained your cat's **${type}** by ${amount}!`);
    },
};

export default command;
