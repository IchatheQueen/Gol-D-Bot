import { Message, Client, Collection } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';
import { resolveTarget } from '../../utils/resolveTarget';

// Cache for confirmation: Key = userId, Value = { targetId, commandName, timestamp }
const confirmations = new Collection<string, { targetId: string, commandName: string, timestamp: number }>();

const command: Command = {
    name: 'ccmdadd',
    description: 'Grant management permission over a custom command',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;

        if (args.length < 2) {
            message.reply('Usage: `~ccmdadd <user> <command>`');
            return;
        }

        const targetResolved = await resolveTarget(message, args, client);
        if (!targetResolved) {
            message.reply('User not found.');
            return;
        }

        const commandName = args[args.length - 1].toLowerCase(); // Last arg is usually command? 
        // Logic: ~ccmdadd @user haunt. 
        // args[0] might be user, args[1] command.
        // resolveTarget handles parsing user from start. We need to find where the command name is.
        // Simple approach: args[0] is user, args[1] is command. 
        // But resolveTarget logic allows consuming args? My resolveTarget helper doesn't consume/return index.
        // I will assume standard format: <target> <command>

        // However, if target is "myid", args[0] is "myid". 
        // If target is mention, args[0] is mention.
        // So args[1] should be command.

        // Wait, resolveTarget is robust. 
        // If I strictly assume args[0] is target and args[1] is command.

        const targetCommandArg = args[1]?.toLowerCase();

        if (!targetCommandArg) {
            message.reply('Please specify a command name.');
            return;
        }

        // Check ownership
        const ownershipCheck = await db.execute({
            sql: 'SELECT owner_id FROM custom_command_ownership WHERE command_name = ? AND owner_id = ?',
            args: [targetCommandArg, userId]
        });

        if (ownershipCheck.rows.length === 0) {
            message.reply(`You do not own the command \`${targetCommandArg}\`.`);
            return;
        }

        // Check Confirmation
        const existingConfirm = confirmations.get(userId);
        const isConfirming = existingConfirm &&
            existingConfirm.targetId === targetResolved.id &&
            existingConfirm.commandName === targetCommandArg &&
            (Date.now() - existingConfirm.timestamp < 30000); // 30 sec window

        if (!isConfirming) {
            // Set confirmation
            confirmations.set(userId, {
                targetId: targetResolved.id,
                commandName: targetCommandArg,
                timestamp: Date.now()
            });

            message.reply(`Are you sure you want to grant ${targetResolved.username} (@${targetResolved.username}) permission over the "${targetCommandArg}" command? They will be able to add and remove player's access to this custom. Re-type the command to confirm this action`);
            return;
        }

        // Execute Grant
        try {
            await db.execute({
                sql: `INSERT INTO custom_command_access (command_name, user_id, access_type) 
                      VALUES (?, ?, 'co_owner') 
                      ON CONFLICT(command_name, user_id) DO UPDATE SET access_type = 'co_owner'`,
                args: [targetCommandArg, targetResolved.id]
            });

            // Clear confirmation
            confirmations.delete(userId);

            message.reply(`${targetResolved.username} (@${targetResolved.username}) has been granted permission over the "${targetCommandArg}" command`);

        } catch (error) {
            console.error('Error in ccmdadd:', error);
            message.reply('An error occurred.');
        }
    }
};

export default command;
