import { Message, Client, EmbedBuilder } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';
import { getInventoryItem, removeInventoryItem } from '../../database/inventory';

const command: Command = {
    name: 'drink',
    description: 'Drink a cold one',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;

        // Check for beer
        const amount = await getInventoryItem(userId, 'beer');
        if (amount < 1n) {
            message.reply('You don\'t have any beer to drink!');
            return;
        }

        await removeInventoryItem(userId, 'beer', 1n);

        // Flavor message per screenshot
        const displayName = message.guild?.members.cache.get(userId)?.displayName || message.author.username;
        const embed = new EmbedBuilder()
            .setDescription(`${displayName} (@${message.author.username}) has loaded themselves with 🍺 and taken a nice long nap`)
            .setColor('#2b2d31');

        message.reply({ embeds: [embed] });

        // Could imply a stun/nap mechanic:
        // "taken a nice long nap" -> maybe stun user? 
        // Screenshot implies just text?
        // Let's stun for 5 mins just for flavor/realism if consistent with other "nap" mechanics?
        // Or just text. I'll stick to text unless asked.
    },
};

export default command;
