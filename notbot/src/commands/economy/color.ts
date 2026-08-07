import { Message, Client, EmbedBuilder } from 'discord.js';
import { Command } from '../../handlers/commandHandler';
import { getInventoryItem } from '../../database/inventory';
import { setUserColor } from '../../database/userColor';

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

        const colorInt = parseInt(cleanColor, 16);
        const finalColor = `#${cleanColor}`;

        await setUserColor(userId, colorInt);

        // Match Screenshot Format:
        // "hammy:3 has successfully updated their color preference to #230000" (in an embed)

        const embed = new EmbedBuilder()
            .setDescription(`${message.author.username} (${message.author}) has successfully updated their color preference to ${finalColor}`)
            .setColor(colorInt);

        message.reply({ embeds: [embed] });
    },
};

export default command;
