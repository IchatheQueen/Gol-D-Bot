import { Message, Client } from 'discord.js';
import db from '../../database/db';
import { items } from '../../data/items';
import { getUser, updateUser } from '../../database/economy';
import { getInventoryItem, removeInventoryItem } from '../../database/inventory';
import { Command } from '../../handlers/commandHandler';
import { formatBigNumber } from '../../utils/bigNumbers';

const command: Command = {
    name: 'use',
    description: 'Use an item',
    execute: async (message: Message, args: string[], client: Client) => {
        const itemId = args[0]?.toLowerCase();
        if (!itemId) {
            message.reply('Usage: ~use <item_id>');
            return;
        }

        const itemDef = items[itemId];
        if (!itemDef) {
            message.reply('That item does not exist.');
            return;
        }

        const amount = await getInventoryItem(message.author.id, itemId);

        if (amount <= 0n) {
            message.reply('You do not have that item.');
            return;
        }

        // Logic for item effects
        if (itemId === 'briefcase') {
            const money = BigInt(Math.floor(Math.random() * 5000) + 1000);
            const user = await getUser(message.author.id);
            await updateUser(message.author.id, { balance: user.balance + money });
            message.reply(`You opened the briefcase and found **💵 ${formatBigNumber(money)}**!`);
        } else if (itemId === 'cat_food') {
            await db.execute({
                sql: 'UPDATE pets SET hunger = MAX(0, hunger - 20) WHERE user_id = ?',
                args: [message.author.id]
            });
            message.reply('You fed your cat.');
        } else {
            message.reply(`You used ${itemDef.name}.`);
        }

        // Decrease amount
        await removeInventoryItem(message.author.id, itemId, 1n);
    },
};

export default command;
