import { Message, Client, EmbedBuilder } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';
import { getUserColor } from '../../database/userColor';
import { userTag } from '../../utils/userTag';

const command: Command = {
    name: 'adopt',
    description: 'Adopt a cat',
    usage: '~adopt',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;

        const existing = await db.execute({
            sql: 'SELECT user_id FROM pets WHERE user_id = ?',
            args: [userId]
        });

        if (existing.rows.length > 0) {
            message.reply('You already have a cat! `~cat` to check on them.');
            return;
        }

        await db.execute({
            sql: 'INSERT INTO pets (user_id) VALUES (?)',
            args: [userId]
        });

        const embed = new EmbedBuilder()
            .setDescription(`${userTag(message)} has successfully adopted a cat! \`~cat\``)
            .setColor(getUserColor(userId));

        message.reply({ embeds: [embed] });
    },
};

export default command;
