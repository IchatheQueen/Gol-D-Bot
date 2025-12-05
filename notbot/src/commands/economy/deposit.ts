import { Message, Client } from 'discord.js';
import { getUser, updateUser } from '../../database/economy';
import { Command } from '../../handlers/commandHandler';
import { parseBigNumber, formatBigNumber } from '../../utils/bigNumbers';

const command: Command = {
    name: 'deposit',
    description: 'Deposit money into your vault as credits',
    aliases: ['dep'],
    execute: async (message: Message, args: string[], client: Client) => {
        const user = await getUser(message.author.id);
        const amountStr = args[0];

        if (!amountStr) {
            message.reply('Please specify an amount to deposit.');
            return;
        }

        let amount = 0n;
        if (amountStr.toLowerCase() === 'all') {
            amount = user.balance;
        } else {
            amount = parseBigNumber(amountStr) || 0n;
        }

        if (amount <= 0n) {
            message.reply('Please specify a valid amount.');
            return;
        }

        if (user.balance < amount) {
            message.reply('You do not have enough money in your wallet.');
            return;
        }

        // Convert to credits (50,000 per credit)
        const credits = amount / 50000n;

        if (credits === 0n) {
            message.reply('You need at least $50,000 to create 1 credit.');
            return;
        }

        // Check max credits (20)
        const maxCredits = 20n;
        const currentCredits = user.credits || 0n;

        if (currentCredits >= maxCredits) {
            message.reply(`Your vault is full! Maximum: ${maxCredits} credits.`);
            return;
        }

        let creditsToAdd = credits;
        if (currentCredits + credits > maxCredits) {
            creditsToAdd = maxCredits - currentCredits;
        }

        const finalAmount = creditsToAdd * 50000n;

        await updateUser(message.author.id, {
            balance: user.balance - finalAmount,
            credits: currentCredits + creditsToAdd,
        });

        message.reply(`Deposited 💵 $${formatBigNumber(finalAmount)} into your vault as 🍥 ${creditsToAdd} credit(s).`);
    },
};

export default command;
