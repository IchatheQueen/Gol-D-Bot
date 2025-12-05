import { Message, Client, EmbedBuilder } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';
import { formatBigNumber } from '../../utils/bigNumbers';

const command: Command = {
    name: 'rank',
    description: 'Check your rank',
    execute: async (message: Message, args: string[], client: Client) => {
        const targetUser = message.mentions.users.first() || message.author;
        const targetId = targetUser.id;

        // Fetch all users to calculate rank
        const result = await db.execute('SELECT id, balance FROM users');
        const users = result.rows as unknown as { id: string; balance: string }[];

        // Sort
        users.sort((a, b) => {
            const balA = BigInt(a.balance || '0');
            const balB = BigInt(b.balance || '0');
            return balA < balB ? 1 : balA > balB ? -1 : 0;
        });

        const rank = users.findIndex(u => u.id === targetId) + 1;
        const user = users.find(u => u.id === targetId);
        const balance = user ? BigInt(user.balance || '0') : 0n;

        const embed = new EmbedBuilder()
            .setTitle(`📊 Rank for ${targetUser.username}`)
            .setDescription(
                `**Rank**: #${rank > 0 ? rank : 'Unranked'}\n` +
                `**Balance**: 💵 ${formatBigNumber(balance)}`
            )
            .setColor('#2f3136');

        message.reply({ embeds: [embed] });
    },
};

export default command;
