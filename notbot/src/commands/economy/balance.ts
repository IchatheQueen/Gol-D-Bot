import { Message, Client, EmbedBuilder } from 'discord.js';
import { getUser } from '../../database/economy';
import { resolveTargetOrSelf } from '../../utils/resolveTarget';

const command: Command = {
    name: 'balance',
    description: 'Check your balance',
    aliases: ['bal', 'money'],
    execute: async (message: Message, args: string[], client: Client) => {
        const target = await resolveTargetOrSelf(message, args, client);
        const userId = target.id;
        const user = await getUser(userId);

        const embed = new EmbedBuilder()
            .setTitle(`💰 ${target.username}'s balance`)
            .setDescription(
                `💵 **Earn extra rewards by playing!**\n` +
                `💵 ${formatBigNumber(user.balance)}`
            )
            .setColor(getUserColor(userId));

        message.reply({ embeds: [embed] });
    },
};

export default command;
