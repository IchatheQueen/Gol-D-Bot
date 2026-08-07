import { Message, Client } from 'discord.js';
import { getUser, adjustFunds } from '../../database/economy';
import { Command } from '../../handlers/commandHandler';
import { parseBigNumber, formatBigNumber } from '../../utils/bigNumbers';

const command: Command = {
    name: 'withdraw',
    description: 'Withdraw credits from your vault as money',
    aliases: ['with'],
    execute: async (message: Message, args: string[], client: Client) => {
        const user = await getUser(message.author.id);
        const amountStr = args[0];

        if (!amountStr) {
            message.reply('Please specify an amount of credits to withdraw.');
            return;
        }

        let credits = 0n;
        const currentCredits = user.credits || 0n;

        if (amountStr.toLowerCase() === 'all') {
            credits = currentCredits;
        } else {
            credits = parseBigNumber(amountStr) || 0n;
        }

        if (credits <= 0n) {
            message.reply('Please specify a valid amount.');
            return;
        }

        if (currentCredits < credits) {
            message.reply('You do not have enough credits in your vault.');
            return;
        }

        // Convert credits to money (50,000 per credit)
        const amount = credits * 50000n;

        const ok = await adjustFunds(message.author.id, {
            balance: amount,
            credits: -credits,
        });

        if (!ok) {
            message.reply('You do not have enough credits in your vault.');
            return;
        }

        message.reply(`Withdrew 🍥 ${credits} credit(s) from your vault as 💵 $${formatBigNumber(amount)}.`);
    },
};

export default command;
