import { Message, Client, EmbedBuilder } from 'discord.js';
import { Command } from '../../handlers/commandHandler';
import { adjustInventoryItem, getInventoryItem } from '../../database/inventory';
import { getUserColor } from '../../database/userColor';
import { parseBigNumber, formatBigNumber } from '../../utils/bigNumbers';
import { resolveTarget } from '../../utils/resolveTarget';

const BEER_ITEM = 'beer';

const command: Command = {
    name: 'paybeer',
    description: 'Pay 🍺 Beer to another user',
    usage: '~paybeer <target> <amount>',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;
        const targetResolved = await resolveTarget(message, args, client, 0);
        const amountStr = args[1];

        if (!amountStr) {
            message.reply('You must enter a positive number!');
            return;
        }

        if (!targetResolved) {
            message.reply('You must mention a user to pay!');
            return;
        }

        if (targetResolved.id === userId) {
            message.reply('You cannot pay yourself!');
            return;
        }

        let amount: bigint;
        if (amountStr.toLowerCase() === 'all') {
            amount = await getInventoryItem(userId, BEER_ITEM);
        } else {
            amount = parseBigNumber(amountStr) ?? 0n;
        }

        if (amount <= 0n) {
            message.reply('You must enter a positive number!');
            return;
        }

        // Debit atomically, then credit; refund if the credit somehow fails.
        const debited = await adjustInventoryItem(userId, BEER_ITEM, -amount);

        if (!debited) {
            message.reply("You don't have that much 🍺 Beer!");
            return;
        }

        try {
            await adjustInventoryItem(targetResolved.id, BEER_ITEM, amount);
        } catch (err) {
            await adjustInventoryItem(userId, BEER_ITEM, amount);
            throw err;
        }

        const embed = new EmbedBuilder()
            .setDescription(`🍺 ${formatBigNumber(amount)} has been paid to ${targetResolved.username}'s account`)
            .setColor(getUserColor(userId));

        message.reply({ embeds: [embed] });
    },
};

export default command;
