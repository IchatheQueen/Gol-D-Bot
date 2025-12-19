import { Message, Client, EmbedBuilder } from 'discord.js';
import db from '../../database/db';
import { getInventory } from '../../database/inventory';
import { Command } from '../../handlers/commandHandler';
import { formatBigNumber } from '../../utils/bigNumbers';

const command: Command = {
    name: 'item',
    description: 'Check your cat items',
    aliases: ['catitems'],
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;

        const inventory = await getInventory(userId);

        const getItem = (id: string) => inventory.find(i => i.item_id === id)?.amount || 0n;

        const displayName = message.guild?.members.cache.get(userId)?.displayName || message.author.username;

        const items = [
            { id: 'water', name: 'Water', emoji: '💧' },
            { id: 'beer', name: 'Beer', emoji: '🍺' },
            { id: 'energy_drink', name: 'Energy Drink', emoji: '🥤' },
            { id: 'coffee', name: 'Coffee', emoji: '☕' },
            { id: 'opioid', name: 'Opioid', emoji: '🔘' },
            { id: 'steroid', name: 'Steroid', emoji: '🔵' },
            { id: 'cat_pill', name: 'Cat Pills', emoji: '💊' },
            { id: 'medicine', name: 'Medicine', emoji: '🧪' }
        ];

        let description = '`~feed <type>` to feed your cat a specific feedable\n\n**Foodstuffs**\n';
        for (const item of items) {
            const amount = getItem(item.id);
            description += `${item.emoji} ${item.name} | ${formatBigNumber(amount)}\n`;
        }

        const embed = new EmbedBuilder()
            .setTitle(`${displayName} (@${message.author.username})'s Cat Inventory`)
            .setDescription(description)
            .setColor('#2b2d31');

        message.reply({ embeds: [embed] });
    },
};

export default command;
