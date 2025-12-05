import { Message, Client, EmbedBuilder } from 'discord.js';
import { getInventory } from '../../database/inventory';
import { Command } from '../../handlers/commandHandler';

const command: Command = {
    name: 'item',
    description: 'Check your cat items',
    aliases: ['catitems'],
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;

        const inventory = await getInventory(userId);

        const catFood = inventory.find(i => i.item_id === 'cat_food')?.amount || 0n;
        const catToy = inventory.find(i => i.item_id === 'cat_toy')?.amount || 0n;
        const pillGen = inventory.find(i => i.item_id === 'pill_generator')?.amount || 0n;

        const embed = new EmbedBuilder()
            .setTitle(`@${message.author.username}'s Cat Items`)
            .setDescription(
                `🐟 **Cat Food** | ${catFood.toLocaleString()}\n` +
                `🎾 **Cat Toy** | ${catToy.toLocaleString()}\n` +
                `🗜️ **Pill Generator** | ${pillGen.toLocaleString()}`
            )
            .setColor('#2f3136');

        message.reply({ embeds: [embed] });
    },
};

export default command;
