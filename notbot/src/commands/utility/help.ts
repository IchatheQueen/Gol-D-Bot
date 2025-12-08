
import { Message, Client, EmbedBuilder } from 'discord.js';
import { Command } from '../../handlers/commandHandler';
import { getUserColor } from '../../database/userColor';

const command: Command = {
    name: 'help',
    description: 'Get help with GoldBot commands',
    execute: async (message: Message, args: string[], client: Client) => {
        const embed = new EmbedBuilder()
            .setTitle('⚠️ GoldBot Help')
            .setDescription('⚠️ Generate a backup code in case of account loss via `~backupcode` in Private Messages!')
            .setColor(getUserColor(message.author.id))
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
                    value: 'If you still have questions or simply wish to be informed of GoldBot\'s updates the moment they\'re released, you\'re always welcome to visit GoldBot\'s support server and have a chill interview with some other users and simply chill there and procrastinate your homework. You can use `~support` for an invite',
                    inline: false
                },
                {
                    name: 'GoldBot Policies',
                    value: '• GoldBot\'s Terms of Service\n• GoldBot\'s Privacy Policy',
                    inline: false
                }
            );

        message.reply({ embeds: [embed] });
    },
};

export default command;
