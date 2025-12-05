import { Message, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, MessageFlags } from 'discord.js';
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

        const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`copy_id_${target.id}`)
                    .setLabel('Copy ID')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('📋')
            );

        const reply = await message.reply({ embeds: [embed], components: [row] });

        const collector = reply.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 60000
        });

        collector.on('collect', async (interaction) => {
            if (interaction.customId === `copy_id_${target.id}`) {
                await interaction.reply({ content: target.id, flags: MessageFlags.Ephemeral });
            }
        });

        collector.on('end', () => {
            // Disable button after timeout
            const disabledRow = new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`copy_id_${target.id}`)
                        .setLabel('Copy ID')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('📋')
                        .setDisabled(true)
                );
            reply.edit({ components: [disabledRow] }).catch(() => { });
        });
    },
};

export default command;
