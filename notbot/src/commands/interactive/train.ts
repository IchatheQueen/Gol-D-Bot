import { Message, Client } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';
import { updatePetStats, isPetDead } from '../../utils/petUtils';

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

        const pet = await updatePetStats(message.author.id);

        if (!pet) {
            message.reply('You need a cat to train!');
            return;
        }

        if (isPetDead(pet)) {
            message.reply('Your cat is dead 💀. You must revive it with `~revive` before training!');
            return;
        }

        if (pet.credits < amount) {
            message.reply(`You don't have enough credits! You have ${pet.credits}.`);
            return;
        }

        // Check Premium
        const userRes = await db.execute({ sql: 'SELECT is_premium FROM users WHERE id = ?', args: [message.author.id] });
        const isPremium = userRes.rows[0]?.is_premium === 1;

        let gain = amount;
        if (isPremium) {
            gain = Math.floor(amount * 1.5);
        }

        await db.execute({
            sql: `UPDATE pets SET ${type} = ${type} + ?, credits = credits - ? WHERE user_id = ?`,
            args: [gain, amount, message.author.id]
        });

        const msg = isPremium
            ? `💎 **PREMIUM BOOST!** You trained your cat's **${type}** by ${gain} (1.5x)!`
            : `You trained your cat's **${type}** by ${gain}!`;

        message.reply(msg);
    },
};

export default command;
