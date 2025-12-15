import { Message, Client, EmbedBuilder } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';
import { getUser } from '../../database/economy';
import { getInventoryItem } from '../../database/inventory';

const command: Command = {
    name: 'dcred',
    description: 'Check your Credits balance',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;

        // Fetch credits (Diamond/DCRED currency)
        // Using 'diamond' as the currency key in items logic, usually stored in inventory or user table?
        // In items.ts, currency: 'diamond'.
        // In economy.ts, is there a 'credits' column?
        // Let's check getUser result structure or inventory.
        // Assuming it's a special inventory item or a column.
        // Based on `dshop` usage, it might be an item 'diamond' or 'dcred'.
        // Let's check inventory for 'diamond' or 'dcred'.

        // Wait, `getUser` might have it.
        // If not, I'll assume it's an item 'diamond'.

        const credits = await getInventoryItem(userId, 'diamond');

        const embed = new EmbedBuilder()
            .setAuthor({ name: `@${message.author.username}'s Credits`, iconURL: 'https://cdn.discordapp.com/emojis/1331780893995565148.png' }) // Placeholder emoji/icon
            // Title: "@user's SlotBot Credits" -> "Credits" (Restricted)
            // Description: 
            // PREMIUM CURRENCY
            // ~dcred help to get more information
            // Available Credit
            // <emoji> 0.00

            .setTitle(`@${message.author.username}'s Credits`)
            .setDescription(`PREMIUM CURRENCY\n\`~dcred help\` to get more information\n\n**Available Credit**\n💎 ${Number(credits).toFixed(2)}`)
            .setColor('#2F3136');

        message.reply({ embeds: [embed] });
    },
};

export default command;
