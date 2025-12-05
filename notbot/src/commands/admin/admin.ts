import { Message, Client, EmbedBuilder } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';

// Admin IDs - can be modified
const ADMIN_IDS = ['1331780893995565148'];

const command: Command = {
    name: 'admin',
    description: 'Manage admin users',
    execute: async (message: Message, args: string[], client: Client) => {
        // Only the owner can manage admins
        if (message.author.id !== '1331780893995565148') {
            message.reply('Only the owner can manage admins.');
            return;
        }

        const action = args[0]?.toLowerCase();
        const targetUser = message.mentions.users.first();

        if (!action) {
            const embed = new EmbedBuilder()
                .setTitle('🔧 Admin Management')
                .setDescription(
                    '`~admin add <@user>` - Add admin\n' +
                    '`~admin remove <@user>` - Remove admin\n' +
                    '`~admin list` - List all admins'
                )
                .setColor('#ff0000');
            message.reply({ embeds: [embed] });
            return;
        }

        switch (action) {
            case 'add': {
                if (!targetUser) {
                    message.reply('Please mention a user to add!');
                    return;
                }
                if (!ADMIN_IDS.includes(targetUser.id)) {
                    ADMIN_IDS.push(targetUser.id);
                    message.reply(`✅ Added **${targetUser.username}** as admin.`);
                } else {
                    message.reply(`${targetUser.username} is already an admin.`);
                }
                break;
            }

            case 'remove': {
                if (!targetUser) {
                    message.reply('Please mention a user to remove!');
                    return;
                }
                if (targetUser.id === '1331780893995565148') {
                    message.reply('Cannot remove the owner!');
                    return;
                }
                const index = ADMIN_IDS.indexOf(targetUser.id);
                if (index > -1) {
                    ADMIN_IDS.splice(index, 1);
                    message.reply(`✅ Removed **${targetUser.username}** from admins.`);
                } else {
                    message.reply(`${targetUser.username} is not an admin.`);
                }
                break;
            }

            case 'list': {
                const adminList = ADMIN_IDS.map(id => `<@${id}>`).join('\n');
                const embed = new EmbedBuilder()
                    .setTitle('👑 Admin List')
                    .setDescription(adminList || 'No admins')
                    .setColor('#ff0000');
                message.reply({ embeds: [embed] });
                break;
            }

            default:
                message.reply('Unknown action! Use: add, remove, list');
        }
    },
};

// Export ADMIN_IDS for other commands to use
export { ADMIN_IDS };
export default command;
