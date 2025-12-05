import { Message, Client, EmbedBuilder } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';
import { getUserColor } from '../../database/userColor';

// Track command count
let commandsParsedToday = 0;
let totalCommandsParsed = 0;

// Reset daily count at midnight
setInterval(() => {
    const now = new Date();
    if (now.getHours() === 0 && now.getMinutes() === 0) {
        commandsParsedToday = 0;
    }
}, 60000);

export function incrementCommandCount() {
    commandsParsedToday++;
    totalCommandsParsed++;
}

const command: Command = {
    name: 'stats',
    description: 'View bot statistics',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;

        // Get actual stats from the bot
        const serverCount = client.guilds.cache.size;
        const usersCached = client.users.cache.size;

        // Get registered users from database
        const result = await db.execute('SELECT COUNT(*) as count FROM users');
        const registeredUsers = result.rows[0] as any;

        // Memory usage
        const memUsage = process.memoryUsage();
        const usedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
        const totalMB = Math.round(memUsage.heapTotal / 1024 / 1024);

        // Bot version (using current date format)
        const now = new Date();
        const botVersion = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}.0`;

        const embed = new EmbedBuilder()
            .setTitle('Random information that nobody cares about')
            .addFields(
                { name: 'Total Server Count', value: serverCount.toLocaleString(), inline: true },
                { name: 'Shards', value: '1', inline: true },
                { name: 'Users Cached', value: usersCached.toLocaleString(), inline: true },
                { name: 'Users Registered', value: registeredUsers.count.toLocaleString(), inline: true },
                { name: 'Commands Parsed (since 6:33 AM PST on 12/4/25)', value: totalCommandsParsed.toLocaleString(), inline: true },
                { name: 'Memory Usage', value: `${usedMB} MB / ${totalMB} MB`, inline: true },
                { name: 'Commands Parsed Today', value: commandsParsedToday.toLocaleString(), inline: true },
                { name: 'Bot Version', value: botVersion, inline: true }
            )
            .setColor(getUserColor(userId));

        message.reply({ embeds: [embed] });
    },
};

export default command;
