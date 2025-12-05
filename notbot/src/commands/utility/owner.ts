
import { Message, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { Command } from '../../handlers/commandHandler';
import { getUserColor } from '../../database/userColor';

const command: Command = {
    name: 'owner',
    description: 'View the bot owner\'s profile',
    execute: async (message: Message, args: string[], client: Client) => {
        const ownerUsername = 'equilibrium_rose'; // Derived from context
        const gunsLolLink = `https://guns.lol/${ownerUsername}`;

        const embed = new EmbedBuilder()
            .setTitle('👑 | Bot Owner Profile')
            .setDescription(`Check out the owner's profile on guns.lol!`)
            .addFields(
                { name: 'Profile', value: `[**guns.lol/${ownerUsername}**](${gunsLolLink})`, inline: true }
            )
            .setColor(getUserColor(message.author.id))
            .setThumbnail(message.author.displayAvatarURL()); // Assuming command runner is owner or looks cool

        const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('View guns.lol')
                    .setStyle(ButtonStyle.Link)
                    .setURL(gunsLolLink)
            );

        message.reply({ embeds: [embed], components: [row] });
    },
};

export default command;
