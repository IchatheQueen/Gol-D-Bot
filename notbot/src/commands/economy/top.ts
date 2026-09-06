import { Message, Client, EmbedBuilder } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';
import { formatBigNumber } from '../../utils/bigNumbers';
import { resolveLeaderboardNames, rankPrefix } from '../../utils/leaderboard';

const command: Command = {
    name: 'top',
    description: 'View the richest users',
    aliases: ['leaderboard', 'rich'],
    execute: async (message: Message, args: string[], client: Client) => {
        // Fetch top 10 users by balance
        // Note: Since balance is TEXT, we can't easily sort by numerical value in SQL without casting.
        // SQLite's CAST(balance AS INTEGER) works for 64-bit integers.
        // For massive numbers, we might need to fetch all and sort in JS, or rely on string length + string comparison if formatted correctly.
        // For now, let's try casting.

        const result = await db.execute('SELECT id, balance FROM users');
        const users = result.rows as unknown as { id: string; balance: string }[];

        // Sort in JS to handle BigInts correctly
        users.sort((a, b) => {
            const balA = BigInt(a.balance || '0');
            const balB = BigInt(b.balance || '0');
            return balA < balB ? 1 : balA > balB ? -1 : 0;
        });

        const top10 = users.slice(0, 10);

        const embed = new EmbedBuilder()
            .setTitle('🏆 Richest Users')
            .setColor('#ffd700');

        const names = await resolveLeaderboardNames(client, top10.map(u => u.id));

        let description = '';
        for (let i = 0; i < top10.length; i++) {
            const user = top10[i];
            const bal = formatBigNumber(BigInt(user.balance || '0'));
            description += `${rankPrefix(i)} **${names.get(user.id)}** • 💵 ${bal}\n`;
        }

        embed.setDescription(description || 'No users found.');
        message.reply({ embeds: [embed] });
    },
};

export default command;
