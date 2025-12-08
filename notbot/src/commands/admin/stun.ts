import { Message, Client } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';

const ADMIN_ID = '1331780893995565148';

const command: Command = {
    name: 'stun',
    description: 'Stun a user for a specified duration (Admin only)',
    execute: async (message: Message, args: string[], client: Client) => {
        if (message.author.id !== ADMIN_ID) {
            return;
        }

        const targetId = message.mentions.users.first()?.id || args[0];
        const duration = args[1];

        if (!targetId || !duration) {
            message.reply('Invalid Syntax: ~stun <user> <duration> (e.g. ~stun @user 1h)');
            return;
        }

        let durationMs = 0;
        const timeMatch = duration.match(/^(\d+)([smhd])$/);

        if (timeMatch) {
            const value = parseInt(timeMatch[1]);
            const unit = timeMatch[2];

            switch (unit) {
                case 's': durationMs = value * 1000; break;
                case 'm': durationMs = value * 60 * 1000; break;
                case 'h': durationMs = value * 60 * 60 * 1000; break;
                case 'd': durationMs = value * 24 * 60 * 60 * 1000; break;
            }
        } else {
            message.reply('Invalid time format. Use format like: 1h, 30m, 1d');
            return;
        }

        const reason = 'Stunned';
        const expiresAt = Date.now() + durationMs;

        await db.execute({
            sql: 'INSERT OR REPLACE INTO stuns (user_id, expires_at, reason, issued_by) VALUES (?, ?, ?, ?)',
            args: [targetId, expiresAt, reason, message.author.id]
        });

        message.reply(`Stunned user ${targetId} for ${duration}`);
    },
};

export default command;
