import { Message, Client, EmbedBuilder } from 'discord.js';
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

        let color = '#ffff00'; // Yellow
        let description = '';

        if (won) {
            await updateUser(message.author.id, { balance: user.balance + bet });
            color = '#00ff00'; // Green
            description = `**Result:** 🪙 ${result.toUpperCase()}\n**You Won:** $${formatBigNumber(bet)}`;
        } else {
            await updateUser(message.author.id, { balance: user.balance - bet });
            color = '#ff0000'; // Red
            description = `**Result:** 🪙 ${result.toUpperCase()}\n**You Lost:** $${formatBigNumber(bet)}`;
        }

        const embed = new EmbedBuilder() // remove Import error by updating imports next
            .setTitle('🪙 Coin Flip')
            .setDescription(description)
            .setColor(color as any); // Cast because format

        message.reply({ embeds: [embed] });
    },
};

export default command;
