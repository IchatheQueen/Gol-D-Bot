import { Message, Client, EmbedBuilder } from 'discord.js';
import { getUser, adjustFunds } from '../../database/economy';
import { Command } from '../../handlers/commandHandler';
import { parseBigNumber, formatBigNumber } from '../../utils/bigNumbers';
import { getUserColor } from '../../database/userColor';
import { userTag } from '../../utils/userTag';
import { applyWithdrawTax } from '../../database/vault';

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
        const keyword = amountStr.toLowerCase();
        if (keyword === 'all' || keyword === 'all_vault') {
            amount = user.vault;
        } else {
            amount = parseBigNumber(amountStr) ?? 0n;
        }

        if (amount <= 0n) {
            message.reply('Please specify a valid amount.');
            return;
        }

        // The tax comes off the top: `amount` leaves the vault, the smaller
        // `net` is what reaches the balance. Grossing up instead would let a
        // full-vault withdraw ask for more than the vault holds.
        const { net, tax } = await applyWithdrawTax(userId, amount);

        const ok = await adjustFunds(userId, { vault: -amount, balance: net });

        if (!ok) {
            message.reply('You do not have that much money in your vault.');
            return;
        }

        const taxLine = tax > 0n ? `\n└ 🏦 Tax: 💵 ${formatBigNumber(tax)}` : '';
        const embed = new EmbedBuilder()
            .setDescription(`${userTag(message)} has withdrawn 💵 ${formatBigNumber(net)} from their vault.${taxLine}`)
            .setColor(getUserColor(userId));

        message.reply({ embeds: [embed] });
    },
};

export default command;
