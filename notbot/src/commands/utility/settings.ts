import { Message, Client, EmbedBuilder } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';

const SETTINGS = {
    'dnd': { col: 'dnd', desc: 'Toddle DND mode (No attacks/interactions)' },
    'shiny': { col: 'shiny_cat', desc: 'Toggle Shiny Cat name' },
    'gifting': { col: 'premium_gifting', desc: 'Toggle Premium Gifting' },
    'recruit': { col: 'recruit_requests', desc: 'Toggle Recruit Requests' },
    'anon': { col: 'lb_anon', desc: 'Toggle Leaderboard Anonymity' }
};

const command: Command = {
    name: 'settings',
    description: 'Manage your user settings',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;
        const key = args[0]?.toLowerCase();

        // fetch current
        let settingsRes = await db.execute({ sql: 'SELECT * FROM user_settings WHERE user_id = ?', args: [userId] });
        if (settingsRes.rows.length === 0) {
            await db.execute({
                sql: 'INSERT INTO user_settings (user_id) VALUES (?)',
                args: [userId]
            });
            settingsRes = await db.execute({ sql: 'SELECT * FROM user_settings WHERE user_id = ?', args: [userId] });
        }
        const settings = settingsRes.rows[0] as any;

        if (key && SETTINGS[key as keyof typeof SETTINGS]) {
            const setting = SETTINGS[key as keyof typeof SETTINGS];
            const currentVal = settings[setting.col];
            const newVal = currentVal === 0 ? 1 : 0; // Toggle

            await db.execute({
                sql: `UPDATE user_settings SET ${setting.col} = ? WHERE user_id = ?`,
                args: [newVal, userId]
            });

            message.reply(`Toggled **${key}** to **${newVal === 1 ? 'ON' : 'OFF'}**.`);
            return;
        }

        // List settings
        const embed = new EmbedBuilder()
            .setTitle('⚙️ User Settings')
            .setColor('#2F3136')
            .setDescription('Usage: `~settings <setting>` to toggle');

        for (const [k, v] of Object.entries(SETTINGS)) {
            const val = settings[v.col] === 1 ? '✅ ON' : '❌ OFF';
            embed.addFields({ name: `${k} [${val}]`, value: v.desc, inline: true });
        }

        message.reply({ embeds: [embed] });
    },
};

export default command;
