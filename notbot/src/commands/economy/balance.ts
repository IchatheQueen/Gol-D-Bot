import { Message, Client, EmbedBuilder } from 'discord.js';
import { getUser } from '../../database/economy';
import { Command } from '../../handlers/commandHandler';
import { getUserColor } from '../../database/userColor';
import { formatBigNumber } from '../../utils/bigNumbers';

const command: Command = {
    name: 'balance',
    description: 'Check your balance',
    aliases: ['bal', 'money'],
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;
        const user = await getUser(userId);

        const embed = new EmbedBuilder()
            .setTitle(`💰 ${message.author.username}'s balance`)
            .setDescription(
                `💵 **Earn extra rewards by playing!**\n` +
                `💵 ${formatBigNumber(user.balance)}`
            )
            .setColor(getUserColor(userId));

        message.reply({ embeds: [embed] });
    },
};

export default command;
