import { Message, Client, EmbedBuilder } from 'discord.js';
import { Command } from '../../handlers/commandHandler';
import { getInventoryItem, removeInventoryItem } from '../../database/inventory';

const command: Command = {
    name: 'smoke',
    description: 'Smoke some weed',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;

        // Check for weed
        const amount = await getInventoryItem(userId, 'weed');
        if (amount < 1n) {
            message.reply('You don\'t have any weed to smoke!');
            return;
        }

        await removeInventoryItem(userId, 'weed', 1n);

        // Flavor message per screenshot
        const embed = new EmbedBuilder()
            .setDescription(`${message.author} has rolled up a blunt of 🌿 and smoked it`)
            .setColor('#2F3136');

        message.reply({ embeds: [embed] });
    },
};

export default command;
