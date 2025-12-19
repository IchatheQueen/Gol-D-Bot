import { Message, Client, EmbedBuilder } from 'discord.js';
import { items } from '../../data/items';
import { getUser, updateUser } from '../../database/economy';
import { getInventoryItem, addInventoryItem, removeInventoryItem } from '../../database/inventory';
import { Command } from '../../handlers/commandHandler';
import { parseBigNumber, formatBigNumber } from '../../utils/bigNumbers';
import { resolveEmoji } from '../../utils/resolveEmoji';
import { plants } from '../inventory/harvest';
import db from '../../database/db';

const command: Command = {
    name: 'buy',
    description: 'Buy an item from the shop',
    execute: async (message: Message, args: string[], client: Client) => {
        const itemId = args[0]?.toLowerCase();
        const amountStr = args[1];
        const amount = parseBigNumber(amountStr || '1') || 1n;

        if (!itemId) {
            message.reply(`You must specify an **ID** under the format of \`~buy <id> <amount>\` \n👁️ Hint: IDs are numerical, but names also work! E.g; ~buy beer`);
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
        if (currency === 'beer' || itemId === '2') {
            // Also restrict buying Beer itself if logic was "cannot buy beer without membership"
            if (itemId === '2') {
                const membershipAmount = await getInventoryItem(message.author.id, '1');
                if (membershipAmount < 1n) {
                    message.reply('You need a **Bar Membership** (ID: 1) to buy Beer! Buy it from the `~pub`.');
                    return;
                }
            }

            // Existing logic for currency == 'beer' (buying WITH beer)
            if (currency === 'beer') {
                const membershipAmount = await getInventoryItem(message.author.id, '1');
                if (membershipAmount < 1n) {
                    message.reply('You need a **Bar Membership** (ID: 1) to buy items with Beer! Buy it from the `~pub`.');
                    return;
                }
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
            const weedAmount = await getInventoryItem(message.author.id, 'weed');
            if (weedAmount < totalPrice) {
                const weedEmoji = resolveEmoji(client, '1445946808982569071') || '🌿';
                message.reply(`You don't have enough Weed! Cost: ${weedEmoji} ${formatBigNumber(totalPrice)}`);
                return;
            }
            await removeInventoryItem(message.author.id, 'weed', totalPrice);
        } else if (currency === 'opioid') {
            const opioidAmount = await getInventoryItem(message.author.id, 'opioid');
            if (opioidAmount < totalPrice) {
                const opioidEmoji = resolveEmoji(client, '<:opioid:1447325599554211940>') || '💊';
                message.reply(`You don't have enough Opioids! Cost: ${opioidEmoji} ${formatBigNumber(totalPrice)}`);
                return;
            }
            await removeInventoryItem(message.author.id, 'opioid', totalPrice);
        } else if (currency === 'pills') {
            // Currency is 'pills', but check item ID 'pill'
            const pillAmount = await getInventoryItem(message.author.id, 'pill');
            if (pillAmount < totalPrice) {
                message.reply(`You don't have enough Pills! Cost: 💊 ${formatBigNumber(totalPrice)}`);
                return;
            }
            await removeInventoryItem(message.author.id, 'pill', totalPrice);
        }

        // Add Item to Inventory
        await addInventoryItem(message.author.id, itemId, amount);

        // Check if item is a plant and set cooldown if needed
        if (plants[itemId]) {
            const cooldownKey = `harvest_${itemId}`;
            const cooldownCheck = await db.execute({
                sql: 'SELECT * FROM cooldowns WHERE user_id = ? AND command = ?',
                args: [message.author.id, cooldownKey]
            });
            const cooldown = cooldownCheck.rows[0] as any;

            // If no cooldown or cooldown expired, set it to full duration
            const isReady = !cooldown || (Number(cooldown.timestamp) + plants[itemId].harvestTime < Date.now());

            if (isReady) {
                await db.execute({
                    sql: 'INSERT OR REPLACE INTO cooldowns (user_id, command, timestamp) VALUES (?, ?, ?)',
                    args: [message.author.id, cooldownKey, Date.now()]
                });
            }
        }

        const itemEmoji = resolveEmoji(client, itemDef.emoji || '📦');
        const displayName = message.guild?.members.cache.get(message.author.id)?.displayName || message.author.username;
        const embed = new EmbedBuilder()
            .setDescription(`${displayName} (@${message.author.username}) has successfully ordered ${itemEmoji} ${formatBigNumber(amount)}! Enjoy :3`)
            .setColor('#2b2d31');

        message.reply({ embeds: [embed] });
    },
};

export default command;
