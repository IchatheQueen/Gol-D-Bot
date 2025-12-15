import { Message, Client, EmbedBuilder } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';
import { resolveTarget } from '../../utils/resolveTarget';

const command: Command = {
    name: 'role',
    description: 'Assign a custom role to a user',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;

        if (args.length < 2) {
            message.reply('Usage: `~role <user> <alias>`');
            return;
        }

        const targetUser = await resolveTarget(message, args, client);
        if (!targetUser) {
            message.reply('User not found.');
            return;
        }

        // args[0] is user, args[1] is alias
        // But what if alias has spaces? We underscored them in creation.
        // Assuming args[1] is alias.
        const alias = args[1].toLowerCase().replace(/\s+/g, '_');

        // Check Access
        // 1. Ownership?
        const ownership = await db.execute({
            sql: 'SELECT role_id FROM custom_role_ownership WHERE alias = ? AND owner_id = ?',
            args: [alias, userId]
        });

        let roleId: string | null = null;

        if (ownership.rows.length > 0) {
            roleId = ownership.rows[0].role_id as string;
        } else {
            // 2. Access Table?
            const access = await db.execute({
                sql: `SELECT o.role_id 
                      FROM custom_role_access a
                      JOIN custom_role_ownership o ON a.alias = o.alias
                      WHERE a.alias = ? AND a.user_id = ?`,
                args: [alias, userId]
            });

            if (access.rows.length > 0) {
                roleId = access.rows[0].role_id as string;
            }
        }

        if (!roleId) {
            message.reply(`You do not have permission to use the role alias \`${alias}\`.`);
            return;
        }

        // Assign Role
        const role = message.guild?.roles.cache.get(roleId);
        if (!role) {
            message.reply('The linked role no longer exists in this server.');
            return;
        }

        const member = await message.guild?.members.fetch(targetUser.id);
        if (!member) {
            message.reply('Target member not found in server.');
            return;
        }

        try {
            await member.roles.add(role);
            message.reply(`✅ **${role.name}** has been given to **${targetUser.username}**!`);
        } catch (error) {
            console.error(error);
            message.reply('Failed to assign role. I might lack permissions (Manage Roles) or the role is higher than mine.');
        }
    }
};

export default command;
