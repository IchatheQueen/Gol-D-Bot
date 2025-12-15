import { Message, Client, EmbedBuilder } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';
import { getUserColor } from '../../database/userColor';
import { resolveTarget } from '../../utils/resolveTarget';

const command: Command = {
    name: 'cstmrl',
    description: 'Manage custom roles: view list or give access',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;

        // Usage 1: ~cstmrl (View list)
        if (args.length === 0) {
            try {
                // Get owned roles
                const owned = await db.execute({
                    sql: 'SELECT alias, role_id FROM custom_role_ownership WHERE owner_id = ?',
                    args: [userId]
                });

                // Get accessed roles
                const accessed = await db.execute({
                    sql: 'SELECT alias, access_type FROM custom_role_access WHERE user_id = ?',
                    args: [userId]
                });

                // Helper to get role name safely
                const getRoleName = (roleId: string) => message.guild?.roles.cache.get(roleId)?.name || 'Unknown Role';

                // Filter accessed to exclude duplicates if owner is in both tables
                const accessedFiltered = accessed.rows.filter((access: any) =>
                    !owned.rows.some((own: any) => own.alias === access.alias)
                );

                const ownedList = owned.rows.map(row => `• **${row.alias}** -> ${getRoleName(row.role_id as string)} (Owner)`).join('\n');
                const accessedList = accessedFiltered.map(row => `• **${row.alias}** (${(row.access_type as string)})`).join('\n');

                const embed = new EmbedBuilder()
                    .setTitle('🎭 Your Custom Roles')
                    .setColor(getUserColor(userId));

                if (ownedList) embed.addFields({ name: 'Owned Roles', value: ownedList });
                if (accessedList) embed.addFields({ name: 'Shared with You', value: accessedList });

                if (!ownedList && !accessedList) {
                    embed.setDescription('You do not own or have access to any custom roles.');
                }

                message.reply({ embeds: [embed] });
            } catch (error) {
                console.error('Error fetching custom roles:', error);
                message.reply('An error occurred.');
            }
            return;
        }

        // Usage 2: ~cstmrl <user> <alias> (Give access)
        if (args.length >= 2) {
            const targetUser = await resolveTarget(message, args, client);
            if (!targetUser) {
                message.reply('User not found.');
                return;
            }

            const alias = args[1].toLowerCase().replace(/\s+/g, '_');

            // Check permission
            // 1. Is Owner?
            const ownership = await db.execute({
                sql: 'SELECT * FROM custom_role_ownership WHERE alias = ? AND owner_id = ?',
                args: [alias, userId]
            });

            // 2. Is Co-Owner? (If we implement co-owner level)
            const accessCheck = await db.execute({
                sql: "SELECT * FROM custom_role_access WHERE alias = ? AND user_id = ? AND access_type IN ('owner', 'co_owner')",
                args: [alias, userId]
            });

            if (ownership.rows.length === 0 && accessCheck.rows.length === 0) {
                message.reply(`You do not have permission to share the role alias \`${alias}\`.`);
                return;
            }

            // Grant Access
            await db.execute({
                sql: `INSERT INTO custom_role_access (alias, user_id, access_type) VALUES (?, ?, 'access')
                       ON CONFLICT(alias, user_id) DO UPDATE SET access_type = 'access'`,
                args: [alias, targetUser.id]
            });

            message.reply(`Given **${targetUser.username}** access to distribute role \`${alias}\`.\nThey can now use \`~role <user> ${alias}\`.`);
            return;
        }

        message.reply('Usage: `~cstmrl` (view list) or `~cstmrl <user> <alias>` (give access)');
    }
};

export default command;
