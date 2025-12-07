import { Message, Client } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';

const ADMIN_ID = '1331780893995565148';

const command: Command = {
    name: 'unblacklist',
    description: 'Unblacklist a user (Admin only)',
    execute: async (message: Message, args: string[], client: Client) => {
        // Check if user is admin
        if (message.author.id !== ADMIN_ID) {
            return; // Silently ignore non-admins
        }

        const targetId = message.mentions.users.first()?.id || args[0];

        if (!targetId) {
            message.reply('Invalid Syntax: ~unblacklist <user_id>');
            return;
        }

        // Remove from blacklist in database
        await db.execute({
            sql: 'DELETE FROM blacklist WHERE user_id = ?',
            args: [targetId]
        });

        // Debug output
        console.log('[GoldBotDebug]');
        console.log(`Unblacklisted user ${targetId}`);

        message.reply(`Unblacklisted user ${targetId}`);
    },
};

export default command;
