import { Message, Client } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';
import { resolveTarget } from '../../utils/resolveTarget';

const command: Command = {
    name: 'ccmdtake',
    description: 'Revoke management permission over a custom command',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;

        if (args.length < 2) {
            message.reply('Usage: `~ccmdtake <user> <command>`');
            return;
        }

        const targetResolved = await resolveTarget(message, args, client);
        if (!targetResolved) {
            message.reply('User not found.');
            return;
        }

        const commandName = args[args.length - 1].toLowerCase();

        // Check ownership (Only Owner can take management)
        const ownershipCheck = await db.execute({
            sql: 'SELECT owner_id FROM custom_command_ownership WHERE command_name = ? AND owner_id = ?',
            args: [commandName, userId]
        });

        if (ownershipCheck.rows.length === 0) {
            message.reply(`You do not own the command \`${commandName}\`.`);
            return;
        }

        // Execute Revoke
        try {
            // Remove 'co_owner' access
            // We only remove if access_type is 'co_owner'. 
            // If they have regular 'access', do we leave it? 
            // "removes all manage level permissions". 
            // I'll delete the entry entirely or downgrade to 'access'? 
            // Usually "take" implies removing the specific permission.
            // I'll delete the entry for 'co_owner'.

            await db.execute({
                sql: "DELETE FROM custom_command_access WHERE command_name = ? AND user_id = ? AND access_type = 'co_owner'",
                args: [commandName, targetResolved.id]
            });

            message.reply(`${targetResolved.username} (@${targetResolved.username}) has lost management permissions over the "${commandName}" command`);

        } catch (error) {
            console.error('Error in ccmdtake:', error);
            message.reply('An error occurred.');
        }
    }
};

export default command;
