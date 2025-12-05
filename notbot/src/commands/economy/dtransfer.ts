import { Message, Client, EmbedBuilder } from 'discord.js';
import { Command } from '../../handlers/commandHandler';
import { items } from '../../data/items';
import { getInventoryItem, addInventoryItem, removeInventoryItem } from '../../database/inventory';
import { getUserColor } from '../../database/userColor';

const command: Command = {
    name: 'dtransfer',
    description: 'Transfer a premium item to another user',
    execute: async (message: Message, args: string[], client: Client) => {
        const targetUser = message.mentions.users.first();
        const itemNameOrId = args.slice(1).join(' ');

        if (!targetUser || !itemNameOrId) {
            message.reply('Usage: `~dtransfer <user> <item name or id>`');
            return;
        }

        if (targetUser.id === message.author.id) {
            message.reply('You cannot transfer items to yourself!');
            return;
        }

        // Find item ID from input (name or ID)
        let itemId = '';
        if (items[itemNameOrId]) {
            itemId = itemNameOrId;
        } else {
            // Search by name
            const found = Object.values(items).find(i => i.name.toLowerCase() === itemNameOrId.toLowerCase());
            if (found) itemId = found.id;
        }

        if (!itemId) {
            message.reply('Invalid item!');
            return;
        }

        // Check if it's a premium item (collectible + diamond currency)
        // Or just check if it's in our premium list p1-p13
        if (!itemId.startsWith('p')) {
            message.reply('You can only transfer premium items with this command.');
            return;
        }

        const senderId = message.author.id;
        const receiverId = targetUser.id;

        // Check Sender Inventory
        const senderAmount = await getInventoryItem(senderId, itemId);

        if (senderAmount < 1n) {
            message.reply(`You don't have **${items[itemId].name}**!`);
            return;
        }

        // Transfer
        await removeInventoryItem(senderId, itemId, 1n);
        await addInventoryItem(receiverId, itemId, 1n);

        const embed = new EmbedBuilder()
            .setDescription(`✅ **${message.author.username}** transferred **${items[itemId].name}** to **${targetUser.username}**!`)
            .setColor(getUserColor(message.author.id));

        message.reply({ embeds: [embed] });
    },
};

export default command;
