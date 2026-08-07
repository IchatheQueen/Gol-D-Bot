import { Message, Client, EmbedBuilder } from 'discord.js';
import { getUser, adjustFunds } from '../../database/economy';
import { Command } from '../../handlers/commandHandler';
import { parseBigNumber, formatBigNumber } from '../../utils/bigNumbers';
import { getUserColor } from '../../database/userColor';
import { userTag } from '../../utils/userTag';

const command: Command = {
    name: 'withdraw',
    description: 'Takes money out of your vault',
    usage: '~withdraw <amount>',
    aliases: ['with'],
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;
        const user = await getUser(userId);
        const amountStr = args[0];

        if (!amountStr) {
            message.reply('Please specify an amount to withdraw.');
            return;
        }

        let amount: bigint;
        if (amountStr.toLowerCase() === 'all') {
            amount = user.vault;
        } else {
            amount = parseBigNumber(amountStr) ?? 0n;
        }

        if (amount <= 0n) {
            message.reply('Please specify a valid amount.');
            return;
        }

        const ok = await adjustFunds(userId, { vault: -amount, balance: amount });

        if (!ok) {
            message.reply('You do not have that much money in your vault.');
            return;
        }

        const embed = new EmbedBuilder()
            .setDescription(`${userTag(message)} has withdrawn 💵 ${formatBigNumber(amount)} from their vault.`)
            .setColor(getUserColor(userId));

        message.reply({ embeds: [embed] });
    },
};

export default command;
