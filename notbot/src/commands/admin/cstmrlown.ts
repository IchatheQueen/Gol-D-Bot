import { Message, Client } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';
import { resolveTarget } from '../../utils/resolveTarget';

const command: Command = {
    name: 'cstmrlown',
    description: 'Admin: Assign ownership of a custom role to a user',
    execute: async (message: Message, args: string[], client: Client) => {
        // Check Admin
        if (message.author.id !== process.env.ADMIN_ID && message.author.id !== '497816040439611393') { // 4978... is likely user logic, keeping standard check
            const adminCheck = await db.execute({
                sql: 'SELECT * FROM users WHERE id = ? AND is_admin = 1',
                args: [message.author.id]
            });
            if (adminCheck.rows.length === 0) return;
        }

        if (args.length < 3) {
            message.reply('Usage: `~cstmrlown <user> <role_id_or_name> <alias>`');
            return;
        }

        const targetUser = await resolveTarget(message, args, client);
        if (!targetUser) {
            message.reply('User not found.');
            return;
        }

        // Parse args: <user> [0] is handled. 
        // We need to handle multi-word role names? 
        // args[0] might be user if resolved.
        // Let's assume standard resolveTarget consumption logic isn't perfect for "middle" args.
        // But resolveTarget usually takes args[0]. 

        // Args adjustment:
        // ~cstmrlown @user RoleID Alias
        // resolveTarget eats args[0] usually.

        const roleInput = args[1];
        const alias = args.slice(2).join(' ').toLowerCase().replace(/\s+/g, '_'); // Normalize alias

        if (!roleInput || !alias) {
            message.reply('Usage: `~cstmrlown <user> <role_id> <alias>`');
            return;
        }

        // Find Role
        const role = message.guild?.roles.cache.get(roleInput) || message.guild?.roles.cache.find(r => r.name === roleInput);
        if (!role) {
            message.reply('Role not found. Please provide a valid Role ID or Name.');
            return;
        }

        try {
            await db.execute({
                sql: `INSERT INTO custom_role_ownership (alias, role_id, owner_id) VALUES (?, ?, ?)
                      ON CONFLICT(alias) DO UPDATE SET role_id = ?, owner_id = ?`,
                args: [alias, role.id, targetUser.id, role.id, targetUser.id]
            });

            // Also automatically give the owner access in access table?
            // Logic in checking permissions typically checks ownership table first, then access table.
            // But for consistency:
            await db.execute({
                sql: `INSERT INTO custom_role_access (alias, user_id, access_type) VALUES (?, ?, 'owner')
                       ON CONFLICT(alias, user_id) DO UPDATE SET access_type = 'owner'`,
                args: [alias, targetUser.id]
            });

            message.reply(`Successfully assigned role **${role.name}** to **${targetUser.username}** with alias \`${alias}\`.`);

        } catch (error) {
            console.error(error);
            message.reply('Database error assigning role.');
        }
    }
};

export default command;
