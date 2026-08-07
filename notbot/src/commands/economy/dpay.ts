import { resolveTarget } from '../../utils/resolveTarget';
import { Message, Client, EmbedBuilder } from 'discord.js';
import { getUser, adjustFunds } from '../../database/economy';
import { Command } from '../../handlers/commandHandler';
import { getUserColor } from '../../database/userColor';
import { parseBigNumber, formatBigNumber } from '../../utils/bigNumbers';

const command: Command = {
    name: 'dpay',
    description: 'Transfer Credits to another user',
    execute: async (message: Message, args: string[], client: Client) => {
        const targetUser = await resolveTarget(message, args, client, 0);
        const amountStr = args[1];

        if (!targetUser || !amountStr) {
            message.reply('Usage: `~dpay <user> <amount>`');
            return;
        }

        if (targetUser.id === message.author.id) {
            message.reply('You cannot pay yourself!');
            return;
        }

        const amount = parseBigNumber(amountStr) ?? 0n;
        if (amount <= 0n) {
            message.reply('Invalid amount!');
            return;
        }

        const sender = await getUser(message.author.id);
        if (sender.credits < amount) {
            message.reply(`You don't have enough credits! You have 💚 ${formatBigNumber(sender.credits)}.`);
            return;
        }

        // Atomic debit, then credit — the previous read-modify-write pair let
        // two concurrent transfers spend the same credits twice.
        const debited = await adjustFunds(message.author.id, { credits: -amount });
        if (!debited) {
            message.reply(`You don't have enough credits! You have 💚 ${formatBigNumber(sender.credits)}.`);
            return;
        }

        try {
            await adjustFunds(targetUser.id, { credits: amount });
        } catch (err) {
            await adjustFunds(message.author.id, { credits: amount });
            throw err;
        }

        const embed = new EmbedBuilder()
            .setDescription(`✅ **${message.author.username}** transferred **💚 ${formatBigNumber(amount)}** to **${targetUser.username}**!`)
            .setColor(getUserColor(message.author.id));

        message.reply({ embeds: [embed] });
    },
};

export default command;

