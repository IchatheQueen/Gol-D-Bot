import { Message, Client, EmbedBuilder } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';
import { getInventoryItem, removeInventoryItem } from '../../database/inventory';
import { resolveTarget } from '../../utils/resolveTarget';

const command: Command = {
    name: 'marry',
    description: 'Propose to another user',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;

        // 1. Check if user is already married
        const marriageCheck = await db.execute({
            sql: 'SELECT * FROM marriages WHERE user1_id = ? OR user2_id = ?',
            args: [userId, userId]
        });

        if (marriageCheck.rows.length > 0) {
            message.reply('You are already married! You be faithful.');
            return;
        }

        // 2. Resolve target
        const targetUser = await resolveTarget(message, args, client);
        if (!targetUser) {
            message.reply('Who do you want to marry?');
            return;
        }

        if (targetUser.id === userId) {
            message.reply('You cannot marry yourself.');
            return;
        }

        // 3. Check if target is already married
        const targetMarriageCheck = await db.execute({
            sql: 'SELECT * FROM marriages WHERE user1_id = ? OR user2_id = ?',
            args: [targetUser.id, targetUser.id]
        });

        if (targetMarriageCheck.rows.length > 0) {
            message.reply('That person is already married!');
            return;
        }

        // 4. Check for Ring
        const ringAmount = await getInventoryItem(userId, 'marriage_ring');
        if (ringAmount < 1n) {
            message.reply('You need a **Marriage Ring** 💍 to propose! Buy one from the shop or find one.');
            return;
        }

        // 5. Propose (Simple confirmation)
        // In a real bot, we'd use a button collector or awaitMessage for "Setting up interaction...". 
        // For simplicity, we assume they accept if they type "yes"?
        // Or better, let's just make it a proposal message that the other user updates?
        // Let's implement a simple "Reply yes to accept" flow.

        if (message.channel.type !== 0) { // 0 is GuildText
            message.reply('This command can only be used in a server text channel.');
            return;
        }

        const channel = message.channel as any; // Cast to any to avoid complex type checks with partials, effectively asserting it has send/awaitMessages

        channel.send(`<@${targetUser.id}>, **${message.author.username}** has proposed to you! 💍\nType \`yes\` in this channel to accept.`);

        const filter = (response: Message) => {
            return response.author.id === targetUser.id && response.content.toLowerCase() === 'yes';
        };

        try {
            const collected = await channel.awaitMessages({ filter, max: 1, time: 30000, errors: ['time'] });

            // Consumed Ring
            await removeInventoryItem(userId, 'marriage_ring', 1n);

            // Create Marriage
            await db.execute({
                sql: 'INSERT INTO marriages (user1_id, user2_id, timestamp, level) VALUES (?, ?, ?, 1)',
                args: [userId, targetUser.id, Date.now()]
            });

            const embed = new EmbedBuilder()
                .setTitle('💍 Marriage!')
                .setDescription(`**${message.author.username}** and **${targetUser.username}** are now married! Congratulations!`)
                .setColor('#FF69B4')
                .setTimestamp();

            channel.send({ embeds: [embed] });

        } catch (e) {
            channel.send(`<@${targetUser.id}> did not respond in time... awkward.`);
        }
    }
};

export default command;
