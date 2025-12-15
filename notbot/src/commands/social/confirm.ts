import { Message, Client, EmbedBuilder } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';

const command: Command = {
    name: 'confirm',
    description: 'Confirm a recruitment request',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;
        const code = args[0];

        if (!code) {
            message.reply('Usage: `~confirm <code>`');
            return;
        }

        // Find Code
        const result = await db.execute({
            sql: 'SELECT * FROM recruitment_codes WHERE code = ?',
            args: [code]
        });

        if (result.rows.length === 0) {
            message.reply('Invalid or expired code.');
            return;
        }

        const request = result.rows[0] as any;

        // Verify validity
        if (request.target_id !== userId) {
            message.reply('This code is not for you.');
            return;
        }

        if (Date.now() > request.expires_at) {
            message.reply('This code has expired.');
            // Cleanup
            await db.execute({ sql: 'DELETE FROM recruitment_codes WHERE code = ?', args: [code] });
            return;
        }

        // Create Recruitment Link
        try {
            await db.execute({
                sql: `INSERT INTO recruitments (recruiter_id, target_id, tag, created_at) VALUES (?, ?, ?, ?)
                      ON CONFLICT(recruiter_id, tag) DO UPDATE SET target_id = ?, created_at = ?`,
                args: [request.recruiter_id, userId, request.tag, Date.now(), userId, Date.now()]
            });

            // Delete used code
            await db.execute({ sql: 'DELETE FROM recruitment_codes WHERE code = ?', args: [code] });

            const recruiter = await client.users.fetch(request.recruiter_id);
            message.reply(`✅ Authorization confirmed! **${recruiter ? recruiter.username : 'User'}** can now execute commands as you using the tag \`${request.tag}\`.\nExample: \`~execute ${request.tag} ~pay @Recruiter 1\``);

        } catch (error) {
            console.error('Error confirming recruitment:', error);
            message.reply('Database error confirming recruitment.');
        }
    }
};

export default command;
