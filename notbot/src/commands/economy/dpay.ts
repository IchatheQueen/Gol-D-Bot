import { Message, Client, EmbedBuilder } from 'discord.js';
import { getUser, updateUser } from '../../database/economy';
import { Command } from '../../handlers/commandHandler';
import { getUserColor } from '../../database/userColor';
import { parseBigNumber, formatBigNumber } from '../../utils/bigNumbers';

const command: Command = {
    name: 'dpay',
    description: 'Transfer Credits to another user',
    execute: async (message: Message, args: string[], client: Client) => {
        const targetUser = message.mentions.users.first();
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
            message.reply(`You don't have enough credits! You have 💎 ${formatBigNumber(sender.credits)}.`);
            return;
        }

        const receiver = await getUser(targetUser.id);

        await updateUser(message.author.id, { credits: sender.credits - amount });
        await updateUser(targetUser.id, { credits: receiver.credits + amount });

        const embed = new EmbedBuilder()
            .setDescription(`✅ **${message.author.username}** transferred **💎 ${formatBigNumber(amount)}** to **${targetUser.username}**!`)
            .setColor(getUserColor(message.author.id));

        message.reply({ embeds: [embed] });
    },
};

