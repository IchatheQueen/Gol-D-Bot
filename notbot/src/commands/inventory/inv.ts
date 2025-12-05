import { Message, Client, EmbedBuilder } from 'discord.js';
import { getInventory } from '../../database/inventory';
import { Command } from '../../handlers/commandHandler';
import { items } from '../../data/items';

const command: Command = {
    name: 'inv',
    description: 'Check your inventory',
    aliases: ['inventory', 'bag'],
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;

        const inventory = await getInventory(userId);
        const userItems = inventory.filter(i => i.amount > 0n);

        const embed = new EmbedBuilder()
            .setTitle(`@${message.author.username}'s Inventory`)
            .setColor('#2f3136');

        if (userItems.length === 0) {
            embed.setDescription('You have no items.');
        } else {
            let description = '';
            for (const item of userItems) {
                const itemDef = items[item.item_id];
                if (itemDef) {
                    description += `${itemDef.emoji || '📦'} **${itemDef.name}** ─ ${item.amount.toLocaleString()}\n`;
                }
            }
            embed.setDescription(description);
        }

        message.reply({ embeds: [embed] });
    },
};

export default command;
