
import { Message, Client } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';
import { resolveTarget } from '../../utils/resolveTarget';

const command: Command = {
    name: 'ccmdown',
    description: 'Grant co-ownership of a custom command',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;
        const ADMIN_ID = '1331780893995565148'; // Bot Owner ID

        if (args.length < 2) {
            message.reply('Usage: `~ccmdown <user> <command>`');
            return;
        }

        const targetUser = await resolveTarget(message, args, client);
        if (!targetUser) {
            message.reply('User not found.');
            return;
        }

        const commandName = args[1].toLowerCase();

        try {
            // Check current ownership
            const ownership = await db.execute({
                sql: 'SELECT owner_id FROM custom_command_ownership WHERE command_name = ?',
                args: [commandName]
            });

            const currentOwnerId = ownership.rows.length > 0 ? (ownership.rows[0] as any).owner_id : null;

            // Admin Override: Transfer Ownership completely
            if (userId === ADMIN_ID) {
                if (currentOwnerId) {
                    await db.execute({
                        sql: 'UPDATE custom_command_ownership SET owner_id = ? WHERE command_name = ?',
                        args: [targetUser.id, commandName]
                    });
                } else {
                    await db.execute({
                        sql: 'INSERT INTO custom_command_ownership (command_name, owner_id) VALUES (?, ?)',
                        args: [commandName, targetUser.id]
                    });
                }
                message.reply(`👮 **Admin Override**: Successfully transferred FULL ownership of \`${commandName}\` to **${targetUser.username}**.`);
                return;
            }

            // Normal User: Grant Co-ownership
            if (currentOwnerId !== userId) {
                message.reply(`You are not the owner of the command \`${commandName}\`. Only the owner can grant co-ownership.`);
                return;
            }

            // Grant 'co_owner' level
            await db.execute({
                sql: `INSERT INTO custom_command_access (command_name, user_id, access_type) 
                      VALUES (?, ?, 'co_owner') 
                      ON CONFLICT(command_name, user_id) DO UPDATE SET access_type = 'co_owner'`,
                args: [commandName, targetUser.id]
            });

            message.reply(`Successfully made **${targetUser.username}** a co-owner of the command \`${commandName}\`.`);

        } catch (error) {
            console.error('Error granting co-ownership:', error);
            message.reply('An error occurred while upgrading user access.');
        }
    }
};

export default command;
