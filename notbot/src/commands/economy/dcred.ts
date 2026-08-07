import { Message, Client, EmbedBuilder } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';
import { getUser } from '../../database/economy';
import { formatBigNumber } from '../../utils/bigNumbers';

const command: Command = {
    name: 'dcred',
    description: 'Check your Credits balance',
    execute: async (message: Message, args: string[], client: Client) => {
        const user = await getUser(message.author.id);
        const credits = user.credits || 0n;

        const embed = new EmbedBuilder()
            .setAuthor({ name: `@${message.author.username}'s Credits`, iconURL: message.author.displayAvatarURL() })
            .setTitle(`@${message.author.username}'s Credits`)
            .setDescription(`PREMIUM CURRENCY\n\`~dcred help\` to get more information\n\n**Available Credit**\n💚 ${formatBigNumber(credits)}`)
            .setColor('#2b2d31');

        message.reply({ embeds: [embed] });
    },
};

export default command;
