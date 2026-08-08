import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder, Client } from 'discord.js';

/**
 * Exists purely to tell users who reach for slash commands that the rest of
 * the bot is message-based. Without it, `/` in a GoldBot server looks like the
 * bot only has four commands.
 */
export default {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('How GoldBot commands work'),

    execute: async (interaction: ChatInputCommandInteraction, _client: Client) => {
        await interaction.reply({
            embeds: [new EmbedBuilder()
                .setTitle('GoldBot Commands')
                .setDescription(
                    'GoldBot uses **message commands** for almost everything — try `~help`.\n\n' +
                    'Slash commands are only used for the profile system:\n' +
                    '• `/profile` — view a profile\n' +
                    '• `/badges` — view, equip and browse badges\n' +
                    '• `/titles` — view, equip and browse titles'
                )
                .setColor('#ffd700')],
            ephemeral: true,
        });
    },
};
