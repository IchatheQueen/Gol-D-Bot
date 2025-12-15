import { Message, Client } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';
import { resolveTarget } from '../../utils/resolveTarget';

const command: Command = {
    name: 'givepremium',
    description: 'Admin: Give premium status to a user',
    execute: async (message: Message, args: string[], client: Client) => {
        const ADMIN_ID = '1331780893995565148';
        if (message.author.id !== process.env.ADMIN_ID && message.author.id !== ADMIN_ID && message.author.id !== '497816040439611393') {
            return;
        }

        const targetUser = await resolveTarget(message, args, client);
        if (!targetUser) {
            message.reply('Usage: `~givepremium <user>`');
            return;
        }

        await db.execute({
            sql: 'UPDATE users SET is_premium = 1 WHERE id = ?',
            args: [targetUser.id]
        });

        message.reply(`✅ **${targetUser.username}** is now a Premium user! (1.5x Training Gains)`);
    }
};

export default command;
