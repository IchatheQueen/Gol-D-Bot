import { Message, Client, EmbedBuilder } from 'discord.js';
import { resolveTargetOrSelf } from '../../utils/resolveTarget';
import { Command } from '../../handlers/commandHandler';
import { getUserColor } from '../../database/userColor';

const command: Command = {
    name: 'id',
    description: 'Get a user\'s Discord ID',
    aliases: ['userid', 'discordid'],
    execute: async (message: Message, args: string[], client: Client) => {
        const target = await resolveTargetOrSelf(message, args, client);

        const embed = new EmbedBuilder()
            .setTitle(`🆔 Discord ID`)
            .setDescription(`**${target.username}**'s ID:\n\`${target.id}\``)
            .setColor(getUserColor(message.author.id));

        message.reply({ embeds: [embed] });
    },
};

export default command;
