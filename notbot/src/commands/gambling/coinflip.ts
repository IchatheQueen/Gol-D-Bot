import { Message, Client } from 'discord.js';
import { getUser, updateUser } from '../../database/economy';
import { Command } from '../../handlers/commandHandler';
import { parseBigNumber, formatBigNumber } from '../../utils/bigNumbers';

const command: Command = {
    name: 'coinflip',
    description: 'Flip a coin',
    aliases: ['cf', 'flip'],
    execute: async (message: Message, args: string[], client: Client) => {
        const user = await getUser(message.author.id);
        const betStr = args[0];
        const choice = args[1]?.toLowerCase();

        if (!betStr || !choice || (choice !== 'heads' && choice !== 'tails' && choice !== 'h' && choice !== 't')) {
            message.reply('Usage: ~coinflip <amount> <heads/tails>');
            return;
        }

        let bet = 0n;
        if (betStr.toLowerCase() === 'all') {
            bet = user.balance;
        } else {
            bet = parseBigNumber(betStr) || 0n;
        }

        if (bet <= 0n) {
            message.reply('Please specify a valid bet amount.');
            return;
        }

        if (user.balance < bet) {
            message.reply('You do not have enough money.');
            return;
        }

        const result = Math.random() < 0.5 ? 'heads' : 'tails';
        const won = (choice.startsWith('h') && result === 'heads') || (choice.startsWith('t') && result === 'tails');

        if (won) {
            await updateUser(message.author.id, { balance: user.balance + bet });
            message.reply(`It was **${result}**! You won $${formatBigNumber(bet)}!`);
        } else {
            await updateUser(message.author.id, { balance: user.balance - bet });
            message.reply(`It was **${result}**! You lost $${formatBigNumber(bet)}.`);
        }
    },
};

export default command;
