
import { Message, Client } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';
import { resolveTarget } from '../../utils/resolveTarget';

const command: Command = {
    name: 'ccmdown',
    description: 'Grant co-ownership of a custom command',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;

        if (args.length < 2) {
            message.reply('Usage: `~ccmdown <user> <command>`');
            return;
        }

        const targetUser = await resolveTarget(message, args[0], client);
        if (!targetUser) {
            message.reply('User not found.');
            return;
        }

        const commandName = args[1].toLowerCase();

        try {
            // Verify ownership (only strictly the OWNER can give co-ownership)
            const ownership = await db.execute({
                sql: 'SELECT owner_id FROM custom_command_ownership WHERE command_name = ? AND owner_id = ?',
                args: [commandName, userId]
            });

            if (ownership.rows.length === 0) {
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
