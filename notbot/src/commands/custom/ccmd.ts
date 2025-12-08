
import { Message, Client, EmbedBuilder } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';
import { getUserColor } from '../../database/userColor';
import { resolveTarget } from '../../utils/resolveTarget';

const command: Command = {
    name: 'ccmd',
    description: 'Manage custom commands: view list or give access',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;

        // Usage 1: ~ccmd (View list)
        if (args.length === 0) {
            try {
                // Get owned commands
                const owned = await db.execute({
                    sql: 'SELECT command_name FROM custom_command_ownership WHERE owner_id = ?',
                    args: [userId]
                });

                // Get accessed commands (co-owner or access)
                const accessed = await db.execute({
                    sql: 'SELECT command_name, access_type FROM custom_command_access WHERE user_id = ?',
                    args: [userId]
                });

                const ownedList = owned.rows.map(row => `• ${row.command_name} (Owner)`).join('\n');
                const accessedList = accessed.rows.map(row => `• ${row.command_name} (${(row.access_type as string).charAt(0).toUpperCase() + (row.access_type as string).slice(1)})`).join('\n');

                const embed = new EmbedBuilder()
                    .setTitle('📜 Your Custom Commands')
                    .setColor(getUserColor(userId));

                if (ownedList) embed.addFields({ name: 'Owned Commands', value: ownedList });
                if (accessedList) embed.addFields({ name: 'Shared with You', value: accessedList });

                if (!ownedList && !accessedList) {
                    embed.setDescription('You do not own or have access to any custom commands.');
                }

                message.reply({ embeds: [embed] });
            } catch (error) {
                console.error('Error fetching custom commands:', error);
                message.reply('An error occurred while fetching your custom commands.');
            }
            return;
        }

        // Usage 2: ~ccmd <user> <command> (Give access)
        if (args.length >= 2) {
            const targetUser = await resolveTarget(message, args[0], client);
            if (!targetUser) {
                message.reply('User not found.');
                return;
            }

            const commandName = args[1].toLowerCase();

            // Check if user has permission to share (Owner or Co-owner)
            try {
                const ownership = await db.execute({
                    sql: 'SELECT owner_id FROM custom_command_ownership WHERE command_name = ? AND owner_id = ?',
                    args: [commandName, userId]
                });

                let hasPermission = ownership.rows.length > 0;

                if (!hasPermission) {
                    const coOwner = await db.execute({
                        sql: 'SELECT access_type FROM custom_command_access WHERE command_name = ? AND user_id = ? AND access_type IN (\'owner\', \'co_owner\')',
                        args: [commandName, userId]
                    });
                    hasPermission = coOwner.rows.length > 0;
                }

                if (!hasPermission) {
                    message.reply(`You do not have permission to share the command \`${commandName}\`.`);
                    return;
                }

                // Grant 'access' level
                await db.execute({
                    sql: `INSERT INTO custom_command_access (command_name, user_id, access_type) 
                          VALUES (?, ?, 'access') 
                          ON CONFLICT(command_name, user_id) DO UPDATE SET access_type = 'access'`,
                    args: [commandName, targetUser.id]
                });

                // Also ensuring they have the skin set in user_command_skins isn't strictly requested but might be useful? 
                // For now, adhering strictly to "give access" = entry in access table.
                // NOTE: The previous skin system used `user_command_skins` to determine WHICH skin to show. 
                // We should probably also INSERT into that if this is a skin access? 
                // But the request says "ccmd shows all custom commands...". 
                // Assuming "Access" just means they CAN use it, checking `user_command_skins` is likely how they actually EQUIP it.
                // Wait, if they have access, they probably need to be able to use `~skin` to equip it?
                // Or does `~ccmd` give them the skin?
                // User said "~ccmd user and command give the user access".

                message.reply(`Successfully gave access to command \`${commandName}\` to **${targetUser.username}**.`);

            } catch (error) {
                console.error('Error sharing command:', error);
                message.reply('An error occurred while sharing the command.');
            }
            return;
        }

        message.reply('Usage: `~ccmd` (view list) or `~ccmd <user> <command>` (give access)');
    }
};

export default command;
