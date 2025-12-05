import { Message, Client } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';

const ADMIN_ID = '1331780893995565148';

const command: Command = {
    name: 'unstun',
    description: 'Remove stun from a user (Admin only)',
    execute: async (message: Message, args: string[], client: Client) => {
        // Check if user is admin
        if (message.author.id !== ADMIN_ID) {
            return; // Silently ignore non-admins
        }

        const targetId = args[0];

        if (!targetId) {
            message.reply('Please specify a user ID');
            return;
        }

        // Check if user is stunned
        const checkStmt = await db.execute({
            sql: 'SELECT * FROM stuns WHERE user_id = ?',
            args: [targetId]
        });
        const stun = checkStmt.rows[0];

        if (!stun) {
            message.reply('User is not stunned');
            return;
        }

        // Remove stun
        await db.execute({
            sql: 'DELETE FROM stuns WHERE user_id = ?',
            args: [targetId]
        });

        const target = await client.users.fetch(targetId).catch(() => null);
        const targetName = target ? target.username : targetId;

        message.react('👍');
        (message.channel as any).send(`Unstunned ❌ ADMIN❌ ${targetName} (@${targetName}) 👌`);
    },
};

export default command;
