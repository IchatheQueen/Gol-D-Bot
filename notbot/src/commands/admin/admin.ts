import { Message, Client, EmbedBuilder } from 'discord.js';
import { Command } from '../../handlers/commandHandler';
import { isAdmin, addAdmin, removeAdmin, getAdmins } from '../../utils/adminUtils';

const OWNER_ID = '1331780893995565148';

const command: Command = {
    name: 'admin',
    description: 'Manage admin users',
    execute: async (message: Message, args: string[], client: Client) => {
        // Only the owner can manage admins
        if (message.author.id !== OWNER_ID) {
            message.reply('Only the owner can manage admins.');
            return;
        }

        const action = args[0]?.toLowerCase();
        const targetUser = message.mentions.users.first() || (args[1] ? { id: args[1], username: args[1] } : null);

        if (!action) {
            const embed = new EmbedBuilder()
                .setTitle('🔧 Admin Management')
                .setDescription(
                    '`~admin add <@user|ID>` - Add admin\n' +
                    '`~admin remove <@user|ID>` - Remove admin\n' +
                    '`~admin list` - List all admins'
                )
                .setColor('#ff0000');
            message.reply({ embeds: [embed] });
            return;
        }

        switch (action) {
            case 'add': {
                if (!targetUser) {
                    message.reply('Please mention a user or provide an ID to add!');
                    return;
                }
                const success = await addAdmin(targetUser.id);
                if (success) {
                    message.reply(`✅ Added **${targetUser.username}** as admin.`);
                } else {
                    message.reply(`Failed to add **${targetUser.username}** as admin.`);
                }
                break;
            }

            case 'remove': {
                if (!targetUser) {
                    message.reply('Please mention a user or provide an ID to remove!');
                    return;
                }
                if (targetUser.id === OWNER_ID) {
                    message.reply('Cannot remove the owner!');
                    return;
                }
                const success = await removeAdmin(targetUser.id);
                if (success) {
                    message.reply(`✅ Removed **${targetUser.username}** from admins.`);
                } else {
                    message.reply(`Failed to remove **${targetUser.username}** from admins.`);
                }
                break;
            }

            case 'list': {
                const adminIds = await getAdmins();
                const adminList = adminIds.map(id => `<@${id}>`).join('\n') || 'No admins';
                const embed = new EmbedBuilder()
                    .setTitle('👑 Admin List')
                    .setDescription(adminList)
                    .setColor('#ff0000');
                message.reply({ embeds: [embed] });
                break;
            }

            default:
                message.reply('Unknown action! Use: add, remove, list');
        }
    },
};

export default command;
