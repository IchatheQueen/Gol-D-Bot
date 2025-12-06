
import { Message, Client } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';

const VALID_STATS = [
    'potency', 'efficiency', 'health', 'hunger', 'thirst',
    'energy', 'strength', 'agility', 'intellect', 'endurance'
];

const command: Command = {
    name: 'rollback',
    description: 'Downgrade your Pill Generator stats and refund Credits',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;
        const stat = args[0]?.toLowerCase();

        if (!stat || !VALID_STATS.includes(stat)) {
            const statsList = VALID_STATS.map(s => `\`${s}\``).join(', ');
            message.reply(`The types of stats you can rollback are ${statsList}`);
            return;
        }

        // Fetch generator
        const genCheck = await db.execute({
            sql: 'SELECT * FROM generators WHERE user_id = ?',
            args: [userId]
        });

        if (genCheck.rows.length === 0) {
            message.reply('You do not own a Pill Generator.');
            return;
        }

        const gen = genCheck.rows[0] as any;
        const colName = `${stat}_level`;
        const currentLevel = gen[colName];

        if (currentLevel <= 1) {
            message.reply(`**${stat}** is already at minimum level (1).`);
            return;
        }

        // Update DB
        await db.execute({
            sql: `UPDATE generators SET credits = credits + 1, ${colName} = ${colName} - 1 WHERE user_id = ?`,
            args: [userId]
        });

        message.reply(`Successfully rolled back **${stat}** to level ${currentLevel - 1} and refunded 1 Credit 🏵️.`);
    }
};

export default command;
