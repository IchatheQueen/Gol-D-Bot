import { Message, Client, EmbedBuilder } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';
import { resolveTarget } from '../../utils/resolveTarget';

const command: Command = {
    name: 'divorce',
    description: 'Divorce your partner',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;

        // Check compatibility with channel type
        if (message.channel.type !== 0) { // GuildText
            message.reply('This command can only be used in a server text channel.');
            return;
        }

        const channel = message.channel as any;

        const marriageCheck = await db.execute({
            sql: 'SELECT * FROM marriages WHERE user1_id = ? OR user2_id = ?',
            args: [userId, userId]
        });

        if (marriageCheck.rows.length === 0) {
            message.reply('You are not married!');
            return;
        }

        const marriage = marriageCheck.rows[0] as any;
        const spouseId = marriage.user1_id === userId ? marriage.user2_id : marriage.user1_id;

        // Simple confirmation
        channel.send(`Are you sure you want to divorce <@${spouseId}>? 💔\nType \`yes\` to confirm.`);

        const filter = (response: Message) => {
            return response.author.id === userId && response.content.toLowerCase() === 'yes';
        };

        try {
            await channel.awaitMessages({ filter, max: 1, time: 30000, errors: ['time'] });

            // Delete marriage
            await db.execute({
                sql: 'DELETE FROM marriages WHERE user1_id = ? OR user2_id = ?',
                args: [userId, userId]
            });

            // Make them lose half money? Too harsh for now. Just split.

            const embed = new EmbedBuilder()
                .setTitle('💔 Divorce')
                .setDescription(`**${message.author.username}** has divorced <@${spouseId}>. Love is dead.`)
                .setColor('#000000')
                .setTimestamp();

            channel.send({ embeds: [embed] });

        } catch (e) {
            channel.send('Divorce cancelled.');
        }
    }
};

export default command;
