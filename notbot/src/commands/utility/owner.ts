
import { Message, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../handlers/commandHandler';
import { getUserColor } from '../../database/userColor';

const createOwnerEmbed = (user: any) => {
    const ownerUsername = 'leahislit_';
    const gunsLolLink = 'https://guns.lol/icha';

    const embed = new EmbedBuilder()
        .setTitle('👑 | Bot Owner Profile')
        .setDescription(`Check out the owner's profile on guns.lol!`)
        .addFields(
            { name: 'Profile', value: `[**guns.lol/icha**](${gunsLolLink})`, inline: true }
        )
        .setColor(getUserColor(user.id))
        .setThumbnail(user.displayAvatarURL());

    const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setLabel('View guns.lol')
                .setStyle(ButtonStyle.Link)
                .setURL(gunsLolLink)
        );

    return { embeds: [embed], components: [row] };
};

const command: Command = {
    name: 'owner',
    description: 'View the bot owner\'s profile',
    data: new SlashCommandBuilder()
        .setName('owner')
        .setDescription('View the bot owner\'s profile'),
    execute: async (message: Message, args: string[], client: Client) => {
        const payload = createOwnerEmbed(message.author);
        await message.reply(payload);
    },
    executeSlash: async (interaction: ChatInputCommandInteraction, client: Client) => {
        const payload = createOwnerEmbed(interaction.user);
        await interaction.reply(payload);
    }
};

export default command;
