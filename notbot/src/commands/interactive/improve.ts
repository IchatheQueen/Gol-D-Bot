
import { Message, Client } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';

const VALID_STATS = [
    'potency', 'efficiency', 'health', 'hunger', 'thirst',
    'energy', 'strength', 'agility', 'intellect', 'endurance'
];

const command: Command = {
    name: 'improve',
    description: 'Upgrade your Pill Generator stats using Credits',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;
        const stat = args[0]?.toLowerCase();

        if (!stat || !VALID_STATS.includes(stat)) {
            // Match screenshot format roughly
            const statsList = VALID_STATS.map(s => `\`${s}\``).join(', ');
            message.reply(`The types of stats you can upgrade are ${statsList}`);
            return;
        }

        // Fetch generator
        const genCheck = await db.execute({
            sql: 'SELECT * FROM generators WHERE user_id = ?',
            args: [userId]
        });

        if (genCheck.rows.length === 0) {
            message.reply('You do not own a Pill Generator (use `~generator`).');
            return;
        }

        const gen = genCheck.rows[0] as any;

        if (gen.credits < 1) {
            message.reply('You do not have enough Credits 🏵️ to improve this stat!');
            return;
        }

        // Update DB
        const colName = `${stat}_level`;
        await db.execute({
            sql: `UPDATE generators SET credits = credits - 1, ${colName} = ${colName} + 1 WHERE user_id = ?`,
            args: [userId]
        });

        const newLevel = gen[colName] + 1;
        message.reply(`Successfully upgraded **${stat}** to level ${newLevel}!`);
    }
};

export default command;
