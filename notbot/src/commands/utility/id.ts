import { Message, Client, EmbedBuilder } from 'discord.js';
import { Command } from '../../handlers/commandHandler';
import { getUserColor } from '../../database/userColor';

const command: Command = {
    name: 'id',
    description: 'Get a user\'s Discord ID',
    aliases: ['userid', 'discordid'],
    execute: async (message: Message, args: string[], client: Client) => {
        const targetUser = message.mentions.users.first();

        let targetId: string;
        let targetName: string;

        if (targetUser) {
            targetId = targetUser.id;
            targetName = targetUser.username;
        } else if (args[0]?.toLowerCase() === 'myid' || args[0]?.toLowerCase() === 'me' || !args[0]) {
            targetId = message.author.id;
            targetName = message.author.username;
        } else if (/^\d{17,19}$/.test(args[0])) {
            // It's already an ID, try to fetch username
            try {
                const user = await client.users.fetch(args[0]);
                targetId = user.id;
                targetName = user.username;
            } catch {
                targetId = args[0];
                targetName = 'Unknown User';
            }
        } else {
            message.reply('Usage: `~id` or `~id <@user>` or `~id myid`');
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle(`🆔 Discord ID`)
            .setDescription(`**${targetName}**'s ID:\n\`${targetId}\``)
            .setColor(getUserColor(message.author.id));

        message.reply({ embeds: [embed] });
    },
};

export default command;
