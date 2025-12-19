import { Message, Client, EmbedBuilder } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';
import { resolveEmoji } from '../../utils/resolveEmoji';

const command: Command = {
    name: 'rollback',
    description: 'Rollback generator stats for credits',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;
        const type = args[0]?.toLowerCase();
        const amount = parseInt(args[1] || '1');

        if (!type || isNaN(amount) || amount <= 0) {
            message.reply('Usage: `~rollback <stat> <amount>`');
            return;
        }

        const statMap: Record<string, string> = {
            'effi': 'efficiency_level', 'efficiency': 'efficiency_level',
            'pot': 'potency_level', 'potency': 'potency_level',
            'health': 'health_level', 'hunger': 'hunger_level',
            'thirst': 'thirst_level', 'energy': 'energy_level',
            'str': 'strength_level', 'strength': 'strength_level',
            'agi': 'agility_level', 'agility': 'agility_level',
            'int': 'intellect_level', 'intellect': 'intellect_level',
            'end': 'endurance_level', 'endurance': 'endurance_level'
        };

        const dbCol = statMap[type];
        if (!dbCol) {
            message.reply('Invalid stat.');
            return;
        }

        let genRes = await db.execute({ sql: 'SELECT * FROM generators WHERE user_id = ?', args: [userId] });
        if (genRes.rows.length === 0) {
            message.reply('You do not have a Pill Generator.');
            return;
        }
        const gen = genRes.rows[0] as any;

        if (gen[dbCol] < amount) {
            message.reply(`Cannot rollback more than you have (${gen[dbCol]}).`);
            return;
        }

        await db.execute({
            sql: `UPDATE generators SET ${dbCol} = ${dbCol} - ?, credits = credits + ? WHERE user_id = ?`,
            args: [amount, amount, userId]
        });

        const embed = new EmbedBuilder()
            .setDescription(`${message.author.username} (@${message.author.username}) has rolled back their pills' ${type} boost by ${amount} points and received 🏵️ ${amount}`)
            .setColor('#2b2d31');

        message.reply({ embeds: [embed] });
    },
};

export default command;
