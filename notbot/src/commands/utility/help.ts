
import { Message, Client, EmbedBuilder } from 'discord.js';
import { Command } from '../../handlers/commandHandler';
import { STATIC_EMBED_COLOR } from '../../database/userColor';

// Base URL of the public site that hosts /terms and /privacy. Set WEBSITE_URL
// in the environment to turn the policy lines into real links.
const WEBSITE_URL = process.env.WEBSITE_URL || '';

const policyValue = WEBSITE_URL
    ? `• [GoldBot's Terms of Service](${WEBSITE_URL}/terms)\n• [GoldBot's Privacy Policy](${WEBSITE_URL}/privacy)`
    : "• GoldBot's Terms of Service\n• GoldBot's Privacy Policy";

const command: Command = {
    name: 'help',
    description: 'Get help with GoldBot commands',
    execute: async (message: Message, args: string[], client: Client) => {
        // `~help <command>` shows that command's own page.
        const query = args[0]?.toLowerCase();

        if (query) {
            const registry = (client as any).commands as Map<string, Command> | undefined;
            const found = registry?.get(query);

            if (!found) {
                message.reply('The command you tried does not have a help page, please look in `~commands` for a list of existing commands');
                return;
            }

            // Aliases are listed under the canonical name, so include it first.
            const aliases = [found.name, ...(found.aliases ?? [])].join('\n');

            const commandEmbed = new EmbedBuilder()
                .setTitle('Command Help')
                .setDescription(found.description)
                .setColor(STATIC_EMBED_COLOR)
                .addFields(
                    { name: 'Aliases', value: aliases, inline: false },
                    { name: 'Usage', value: found.usage || `~${found.name}`, inline: false },
                );

            message.reply({ embeds: [commandEmbed] });
            return;
        }

        // No title: the embed opens straight into the backup-code warning.
        // Static colour rather than the per-user ~color value.
        const embed = new EmbedBuilder()
            .setDescription('⚠️ Generate a backup code in case of account loss via `~backupcode` in Private Messages!')
            .setColor(STATIC_EMBED_COLOR)
            .addFields(
                {
                    name: 'Commands',
                    value: 'For a list of user commands, type `~commands`. For more information on a certain command, type `~help <command>`',
                    inline: false
                },
                {
                    name: 'Invite Me',
                    value: 'Invite me to your server via this link:\n[Invite Link](https://discord.com/oauth2/authorize?client_id=1445933483976560680&permissions=8&integration_type=0&scope=bot)',
                    inline: false
                },
                {
                    name: 'Shortcuts',
                    value: 'For a list of abbreviations to know while using GoldBot, check `~shortcuts`',
                    inline: false
                },
                {
                    name: 'GoldBot',
                    value: 'If you still have questions or simply wish to be informed about GoldBot\'s updates the moment they\'re released, you\'re always welcome to visit GoldBot\'s support server and have a nice chat with some other users or simply chill there and procrastinate your homework. You can use `~support` for an invite',
                    inline: false
                },
                {
                    name: 'GoldBot Policies',
                    value: policyValue,
                    inline: false
                }
            );

        message.reply({ embeds: [embed] });
    },
};

export default command;
