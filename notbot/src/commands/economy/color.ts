import { Message, Client, EmbedBuilder } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';
import { getInventoryItem } from '../../database/inventory';

const command: Command = {
    name: 'color',
    description: 'Change your embed sidebar color preference',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;

        // Check if user has Conjuror
        const conjurorAmount = await getInventoryItem(userId, 'p7');
        if (conjurorAmount < 1n) {
            message.reply('You need the **Conjuror** donator item to use this command! Check `~dshop`.');
            return;
        }

        const colorCode = args[0];

        if (!colorCode) {
            message.reply('Usage: `~color <hex_code>`\nExample: `~color #ff0000` or `~color ff0000`');
            return;
        }

        // Clean up color code
        let cleanColor = colorCode.replace('#', '').toUpperCase();

        // Validate hex color
        if (!/^[0-9A-F]{6}$/i.test(cleanColor)) {
            message.reply('Invalid hex color! Use format like `#ff0000` or `ff0000`.');
            return;
        }

        // Store with # prefix
        const finalColor = `#${cleanColor}`;

        // Ensure color_preference column exists and update
        try {
            await db.execute('ALTER TABLE users ADD COLUMN color_preference TEXT DEFAULT "#39C5BB"');
        } catch (e) {
            // Column already exists
        }

        await db.execute({
            sql: 'UPDATE users SET color_preference = ? WHERE id = ?',
            args: [finalColor, userId]
        });

        const embed = new EmbedBuilder()
            .setDescription(`Your embed color has been changed to **${finalColor}**!`)
            .setColor(parseInt(cleanColor, 16));

        message.reply({ embeds: [embed] });
    },
};

export default command;
