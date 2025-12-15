import { Message, Client, EmbedBuilder } from 'discord.js';
import { Command } from '../../handlers/commandHandler';
import { getUserColor } from '../../database/userColor';

const command: Command = {
    name: 'ccmdhelp',
    description: 'Help index for custom command management',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;

        const embed = new EmbedBuilder()
            .setTitle('Custom Command Help Index')
            .setDescription('What each custom command management command does')
            .addFields(
                {
                    name: 'Management',
                    value: '`~ccmds` lists what commands you have management permissions to.\n' +
                        '`~ccmd <target> <key>` gives/takes access of a custom (Does **not** grant Management)'
                },
                {
                    name: 'Ownership',
                    value: '`~ccmdclaim <key>` claims co-ownership and access over a custom you own\n' +
                        '`~ccmdadd <target> <key>` grants the target user **MANAGEMENT ACCESS** and the target user to have all manage level permissions\n' +
                        '`~ccmdtake <target> <key>` revokes the target users **MANAGEMENT ACCESS** and removes all manage level permissions over that custom\n' +
                        '`~ccmdpurge <key>` [Cost: $4.00 DCRED] purges the custom and removes all users from access and co-ownership.\n' +
                        '`~ccmdtransfer <target> <key>` fully transfers ownership to the target **THIS ACTION CANNOT BE UNDONE**'
                }
            )
            .setColor(getUserColor(userId)); // Screenshot shows cyan/teal, but user color is standard.

        message.reply({ embeds: [embed] });
    }
};

export default command;
