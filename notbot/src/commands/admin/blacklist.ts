import { Message, Client } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';

const ADMIN_ID = '1331780893995565148';

const command: Command = {
    name: 'blacklist',
    description: 'Blacklist a user (Admin only)',
    execute: async (message: Message, args: string[], client: Client) => {
        // Check if user is admin
        if (message.author.id !== ADMIN_ID) {
            return; // Silently ignore non-admins
        }

        const targetId = args[0];

        if (!targetId || args.length < 2) {
            message.reply('Invalid Syntax: ~blacklist <user_id> <reason>');
            return;
        }

        const reason = args.slice(1).join(' ');
        const timestamp = Date.now();

        // Store blacklist in database
        await db.execute({
            sql: 'INSERT OR REPLACE INTO blacklist (user_id, reason, timestamp) VALUES (?, ?, ?)',
            args: [targetId, reason, timestamp]
        });

        // Debug output
        console.log('[GoldBotDebug]');
        console.log(`target == ${targetId}`);
        console.log(`Object Generated == {"template":"DEFAULT","timestampExpires":"0","reason":"${reason}","anti_cheat":false,"issuedBy":"${message.author.id}","appealable":true,"id":"DSCOOYSGGT","timestamp":"${timestamp}"}`);

        message.reply(`Blacklisted user ${targetId}`);
    },
};

export default command;
