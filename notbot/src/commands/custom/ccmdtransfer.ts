import { Message, Client, Collection } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';
import { resolveTarget } from '../../utils/resolveTarget';

const confirmations = new Collection<string, { targetId: string, commandName: string, timestamp: number }>();

const command: Command = {
    name: 'ccmdtransfer',
    description: 'Transfer ownership of a custom command',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;

        if (args.length < 2) {
            message.reply('Usage: `~ccmdtransfer <user> <command>`');
            return;
        }

        const targetResolved = await resolveTarget(message, args, client);
        if (!targetResolved) {
            message.reply('User not found.');
            return;
        }

        const commandName = args[args.length - 1].toLowerCase();

        // Check ownership
        const ownershipCheck = await db.execute({
            sql: 'SELECT owner_id FROM custom_command_ownership WHERE command_name = ? AND owner_id = ?',
            args: [commandName, userId]
        });

        if (ownershipCheck.rows.length === 0) {
            message.reply(`You do not own the command \`${commandName}\`.`);
            return;
        }

        // Confirmation
        const existingConfirm = confirmations.get(userId);
        const isConfirming = existingConfirm &&
            existingConfirm.targetId === targetResolved.id &&
            existingConfirm.commandName === commandName &&
            (Date.now() - existingConfirm.timestamp < 30000);

        if (!isConfirming) {
            confirmations.set(userId, {
                targetId: targetResolved.id,
                commandName: commandName,
                timestamp: Date.now()
            });

            message.reply(`Are you sure you want to **TRANSFER OWNERSHIP** of \`${commandName}\` to ${targetResolved.username}? **THIS ACTION CANNOT BE UNDONE**. Re-type the command to confirm.`);
            return;
        }

        // Execute Transfer
        try {
            // Update Ownership
            await db.execute({
                sql: 'UPDATE custom_command_ownership SET owner_id = ? WHERE command_name = ?',
                args: [targetResolved.id, commandName]
            });

            // Ensure permissions are cleaned up? 
            // Old owner becomes nothing? Or stays as 'co_owner'? 
            // Usually transfer implies full handoff.

            // Grant new owner 'co_owner' (admin) or just rely on ownership table?
            // Systems rely on ownership table usually. 
            // But we should probably remove the NEW owner from 'access' table if they were there, to avoid redundancy 
            // or ensure they have access if the system checks access table too.
            // I'll ensure they are Removed from 'access' table since they are now Owner (implicit access).

            await db.execute({
                sql: 'DELETE FROM custom_command_access WHERE command_name = ? AND user_id = ?',
                args: [commandName, targetResolved.id]
            });

            confirmations.delete(userId);

            message.reply(`Successfully transferred ownership of \`${commandName}\` to **${targetResolved.username}**.`);

        } catch (error) {
            console.error('Error in ccmdtransfer:', error);
            message.reply('An error occurred.');
        }
    }
};

export default command;
