import { Message, Client, EmbedBuilder } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';

const command: Command = {
    name: 'improve',
    description: 'Improve generator stats using points',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;
        const type = args[0]?.toLowerCase();
        const amount = parseInt(args[1] || '1');

        if (!type || isNaN(amount) || amount <= 0) {
            message.reply('Usage: `~improve <stat> <amount>`');
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
            message.reply('Invalid stat. Valid: potency, efficiency, health, hunger, thirst, energy, strength, agility, intellect, endurance');
            return;
        }

        let genRes = await db.execute({ sql: 'SELECT credits FROM generators WHERE user_id = ?', args: [userId] });
        if (genRes.rows.length === 0) {
            message.reply('You don\'t have a generator.');
            return;
        }
        const gen = genRes.rows[0] as any;

        if (gen.credits < amount) {
            message.reply(`Not enough credits. You have ${gen.credits}.`);
            return;
        }

        await db.execute({
            sql: `UPDATE generators SET ${dbCol} = ${dbCol} + ?, credits = credits - ? WHERE user_id = ?`,
            args: [amount, amount, userId]
        });

        const embed = new EmbedBuilder()
            .setDescription(`${message.author.username} (@${message.author.username}) has improved their pills' ${type} boost by ${amount} points`)
            .setColor('#2b2d31');

        message.reply({ embeds: [embed] });
    },
};

export default command;
