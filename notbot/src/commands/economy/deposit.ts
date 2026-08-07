import { Message, Client, EmbedBuilder } from 'discord.js';
import { getUser, adjustFunds } from '../../database/economy';
import { Command } from '../../handlers/commandHandler';
import { parseBigNumber, formatBigNumber } from '../../utils/bigNumbers';
import { getUserColor } from '../../database/userColor';
import { getVaultTier, vaultCapacity } from '../../database/vault';
import { userTag } from '../../utils/userTag';

const command: Command = {
    name: 'deposit',
    description: 'Puts money into your vault',
    usage: '~deposit <amount>',
    aliases: ['dep'],
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;
        const user = await getUser(userId);
        const amountStr = args[0];

        if (!amountStr) {
            message.reply('Please specify an amount to deposit.');
            return;
        }

        const tier = await getVaultTier(userId);
        const capacity = vaultCapacity(tier);
        const room = capacity - user.vault;

        if (room <= 0n) {
            message.reply(`Your vault is full! Use \`~upgrade\` to raise its capacity.`);
            return;
        }

        let amount: bigint;
        if (amountStr.toLowerCase() === 'all') {
            amount = user.balance;
        } else {
            amount = parseBigNumber(amountStr) ?? 0n;
        }

        if (amount <= 0n) {
            message.reply('Please specify a valid amount.');
            return;
        }

        if (amount > user.balance) {
            message.reply('You do not have enough money in your wallet.');
            return;
        }

        // Clamp to remaining storage rather than refusing outright.
        const clamped = amount > room ? room : amount;

        const ok = await adjustFunds(userId, { balance: -clamped, vault: clamped });

        if (!ok) {
            message.reply('You do not have enough money in your wallet.');
            return;
        }

        const embed = new EmbedBuilder()
            .setDescription(`${userTag(message)} has successfully vaulted 💵 ${formatBigNumber(clamped)}.`)
            .setColor(getUserColor(userId));

        if (clamped < amount) {
            embed.setDescription(
                `${userTag(message)} has successfully vaulted 💵 ${formatBigNumber(clamped)}.\n\n` +
                `⚠️ We've automatically adjusted the amount to account for your remaining storage!`
            );
        }

        message.reply({ embeds: [embed] });
    },
};

export default command;
