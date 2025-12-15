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
        const amountStr = args[1];
        const amount = parseInt(amountStr);

        const statMap: any = {
            'effi': 'stat_efficiency', 'efficiency': 'stat_efficiency',
            'pot': 'stat_potency', 'potency': 'stat_potency',
            'health': 'stat_health', 'hunger': 'stat_hunger',
            'thirst': 'stat_thirst', 'energy': 'stat_energy',
            'str': 'stat_strength', 'strength': 'stat_strength',
            'agi': 'stat_agility', 'agility': 'stat_agility',
            'int': 'stat_intellect', 'intellect': 'stat_intellect',
            'end': 'stat_endurance', 'endurance': 'stat_endurance',
            'meta': 'stat_metabolism', 'metabolism': 'stat_metabolism'
        };

        const displayMap: any = {
            'stat_efficiency': 'efficiency',
            'stat_potency': 'potency',
            'stat_health': 'health',
            'stat_hunger': 'hunger',
            'stat_thirst': 'thirst',
            'stat_energy': 'energy',
            'stat_strength': 'strength',
            'stat_agility': 'agility',
            'stat_intellect': 'intellect',
            'stat_endurance': 'endurance',
            'stat_metabolism': 'metabolism'
        };

        const dbCol = statMap[type];

        if (!dbCol || !amount || amount <= 0) {
            message.reply('Usage: `~rollback <stat> <amount>`');
            return;
        }

        const genRes = await db.execute({ sql: 'SELECT * FROM generators WHERE user_id = ?', args: [userId] });
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
            sql: `UPDATE generators SET ${dbCol} = ${dbCol} - ?, points = points + ? WHERE user_id = ?`,
            args: [amount, amount, userId]
        });

        const displayStat = displayMap[dbCol];

        // Screenshot format:
        // @pois6n has rolled back their pills' intellect boost by 236 points and received 🏵️ 236
        // Uses Embed? Screenshot has a dark background box.
        const embed = new EmbedBuilder()
            .setDescription(`${message.author} has rolled back their pills' ${displayStat} boost by ${amount} points and received 🏵️ ${amount}`)
            .setColor('#2F3136');

        message.reply({ embeds: [embed] });
    },
};

export default command;
