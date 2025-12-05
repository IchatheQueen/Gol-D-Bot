import { Message, Client, EmbedBuilder } from 'discord.js';
import { items } from '../../data/items';
import { getUser, updateUser } from '../../database/economy';
import { getInventoryItem, addInventoryItem, removeInventoryItem } from '../../database/inventory';
import { Command } from '../../handlers/commandHandler';
import { parseBigNumber, formatBigNumber } from '../../utils/bigNumbers';

const command: Command = {
    name: 'buy',
    description: 'Buy an item from the shop',
    execute: async (message: Message, args: string[], client: Client) => {
        const itemId = args[0]?.toLowerCase();
        const amountStr = args[1];
        const amount = parseBigNumber(amountStr || '1') || 1n;

        if (!itemId) {
            message.reply('Usage: `~buy <id> <amount>`');
            return;
        }

        if (amount < 1n) {
            message.reply('Invalid amount.');
            return;
        }

        const itemDef = items[itemId];
        if (!itemDef) {
            message.reply('That item does not exist.');
            return;
        }

        const user = await getUser(message.author.id);
        const currency = itemDef.currency || 'cash';
        const price = parseBigNumber(itemDef.price.toString()) || 0n;
        const totalPrice = price * amount;

        // Check Bar Membership for Beer purchases
        if (currency === 'beer') {
            const membershipAmount = await getInventoryItem(message.author.id, '1');
            if (membershipAmount < 1n) {
                message.reply('You need a **Bar Membership** (ID: 1) to buy items with Beer! Buy it from the `~pub`.');
                return;
            }
        }

        // Check Balance
        if (currency === 'cash') {
            if (user.balance < totalPrice) {
                message.reply(`You cannot afford this item. Cost: $${formatBigNumber(totalPrice)}`);
                return;
            }
            await updateUser(message.author.id, { balance: user.balance - totalPrice });
        } else if (currency === 'beer') {
            // Check beer inventory (ID: 2)
            const beerAmount = await getInventoryItem(message.author.id, '2');

            if (beerAmount < totalPrice) {
                message.reply(`You don't have enough Beer! Cost: 🍺 ${formatBigNumber(totalPrice)}`);
                return;
            }

            await removeInventoryItem(message.author.id, '2', totalPrice);
        } else if (currency === 'diamond') {
            if (user.credits < totalPrice) {
                message.reply(`You don't have enough Diamonds/Credits! Cost: 💎 ${formatBigNumber(totalPrice)}`);
                return;
            }
            await updateUser(message.author.id, { credits: user.credits - totalPrice });
        } else if (currency === 'weed') {
            message.reply('Weed currency not implemented yet.');
            return;
        }

        // Add Item to Inventory
        await addInventoryItem(message.author.id, itemId, amount);

        message.reply(`You bought **${formatBigNumber(amount)}x ${itemDef.name}** for ${currency === 'beer' ? '🍺' : currency === 'cash' ? '$' : ''}${formatBigNumber(totalPrice)}.`);
    },
};

export default command;
