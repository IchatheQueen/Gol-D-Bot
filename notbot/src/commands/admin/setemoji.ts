
import { Message, Client, EmbedBuilder } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';
import { getUserColor } from '../../database/userColor';

const command: Command = {
    name: 'setemoji',
    description: 'Bind an emoji to a key name (Admin only)',
    execute: async (message: Message, args: string[], client: Client) => {
        const ADMIN_ID = '1331780893995565148';
        if (message.author.id !== ADMIN_ID) {
            return;
        }

        if (args.length < 2) {
            message.reply('Usage: `~setemoji <key> <emoji>`\nExample: `~setemoji rifle 🔫`');
            return;
        }

        const key = args[0];
        const emoji = args[1];

        // Save to DB
        await db.execute({
            sql: 'INSERT INTO emoji_overrides (key, emoji) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET emoji = excluded.emoji',
            args: [key, emoji]
        });

        // Update cache immediately
        (client as any).emojiOverrides.set(key, emoji);

        const color = getUserColor(message.author.id);
        const embed = new EmbedBuilder()
            .setDescription(`✅ Set emoji for **${key}** to ${emoji}`)
            .setColor(color);

        await message.reply({ embeds: [embed] });
    },
};

export default command;
