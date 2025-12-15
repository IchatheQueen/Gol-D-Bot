import { Message, Client, EmbedBuilder } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';
import { getInventory } from '../../database/inventory';
import { items } from '../../data/items';
import { updatePetStats } from '../../utils/petUtils';

const command: Command = {
    name: 'cati',
    description: 'Check your cat\'s inventory',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;
        const pet = await updatePetStats(userId);

        if (!pet) {
            message.reply('You don\'t have a pet!');
            return;
        }

        // Cat inventory is just the user's inventory filtered for cat items?
        // Or does the cat have its own inventory?
        // "cati" -> Cat Inventory.
        // Usually implies items *for* the cat (Food, Pills, etc.)
        // OR items the cat is *holding*?
        // Given `feed.ts` checks user inventory, `cati` likely effectively filters user inventory for "cat-usable" items.
        // OR it's a separate table `cat_inventory`?
        // I'll assume users want to see "Cat Food, Pills, etc." from their OWN inventory.

        const inventory = await getInventory(userId);

        // Filter for cat items
        // We can check item.type or ID list.
        const catItemIds = [
            'cat_food', 'pill', 'cat_pill', 'medicine', 'auto_feeder',
            'laser', 'cat_cosmetic', // Hypothethical
            // Foods
            'beer', 'energy_drink', 'coffee', 'opioid', 'steroid' // Since feed accepts these
        ];

        const catItems = inventory.filter(i => catItemIds.includes(i.item_id) || items[i.item_id]?.type === 'cat_resource');

        if (catItems.length === 0) {
            message.reply('Your cat inventory is empty!');
            return;
        }

        const description = catItems.map(i => {
            const itemDef = items[i.item_id];
            const emoji = itemDef?.emoji || '📦';
            const name = itemDef?.name || i.item_id;
            return `${emoji} **${name}** x${i.amount}`;
        }).join('\n');

        const embed = new EmbedBuilder()
            .setTitle(`[Lvl ${pet.level}] ${pet.name}'s Stash`) // Flavor title
            .setDescription(description)
            .setColor('#2F3136');

        message.reply({ embeds: [embed] });
    },
};

export default command;
