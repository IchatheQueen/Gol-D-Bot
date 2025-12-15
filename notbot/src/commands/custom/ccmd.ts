
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

        if (args.length < 2) {
            const codeBlock = '`';
            message.reply(`The format of this command is ${codeBlock}~ccmd <user> <command name>${codeBlock}`);
            return;
        }

        // Usage 2: ~ccmd <user> <command> (Give access)
        if (args.length >= 2) {
            const targetUser = await resolveTarget(message, args, client);
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

                // Toggle Access
                const accessCheck = await db.execute({
                    sql: 'SELECT * FROM custom_command_access WHERE command_name = ? AND user_id = ?',
                    args: [commandName, targetUser.id]
                });

                if (accessCheck.rows.length > 0) {
                    // Revoke
                    await db.execute({
                        sql: 'DELETE FROM custom_command_access WHERE command_name = ? AND user_id = ?',
                        args: [commandName, targetUser.id]
                    });
                    message.reply(`${targetUser.username} (@${targetUser.id}) has lost access to the ${commandName} command`);
                } else {
                    // Grant
                    await db.execute({
                        sql: 'INSERT INTO custom_command_access (command_name, user_id, access_type) VALUES (?, ?, ?)',
                        args: [commandName, targetUser.id, 'access']
                    });
                    message.reply(`${targetUser.username} (@${targetUser.id}) has gained access to the ${commandName} command`);
                }
                return;
            } catch (err) {
                console.error(err);
                message.reply('An error occurred.');
            }
        } else {
            message.reply('Usage: `~ccmd` (view list) or `~ccmd <user> <command>` (give access)');
        }
    }
};

export default command;
