import { Message, Client, EmbedBuilder } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';
import { getUserColor } from '../../database/userColor';

const command: Command = {
    name: 'forcedrop',
    description: 'Force a wallet drop in the current channel',
    execute: async (message: Message, args: string[], client: Client) => {
        // Admin check (using the hardcoded ID from index.ts logic for now, or just allow it since it's debug)
        const ADMIN_ID = '1331780893995565148';
        if (message.author.id !== ADMIN_ID) {
            return;
        }

        const amount = Math.floor(Math.random() * 900000000000) + 100000000000; // 100B - 1T
        const scenarios = [
            "A snobby old lady dropped their purse, exposing their wallet!",
            "A rich kid tripped and their wallet fell out!",
            "An employee's briefcase opened, revealing a wallet!",
            "A wallet mysteriously appeared on the ground!",
        ];
        const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];

        // Check DB for existing drop
        const existingDrop = await db.execute({
            sql: 'SELECT * FROM wallet_drops WHERE channel_id = ?',
            args: [message.channel.id]
        });

        if (existingDrop.rows.length === 0) {
            // Insert into DB
            await db.execute({
                sql: 'INSERT INTO wallet_drops (channel_id, amount, timestamp) VALUES (?, ?, ?)',
                args: [message.channel.id, amount.toString(), Date.now()]
            });
        }

        await (message.channel as any).send(`${scenario} \`~grab\` to quickly steal it.`);
        await message.delete().catch(() => { }); // Delete the command message to keep it clean
    },
};

export default command;
