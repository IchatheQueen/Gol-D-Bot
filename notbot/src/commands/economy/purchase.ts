import { Message, Client, EmbedBuilder } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';
import { getUser } from '../../database/economy';
import { getInventoryItem } from '../../database/inventory';
import { getUserColor } from '../../database/userColor';

import { stockTypes } from '../../data/stockTypes';
import { resolveEmoji } from '../../utils/resolveEmoji';

const command: Command = {
    name: 'purchase',
    description: 'Purchase stock shares',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;
        const amountArg = args[0]?.toLowerCase();
        const stockType = parseInt(args[1]) || 1;

        // Check if user has Statistician
        const statAmount = await getInventoryItem(userId, 'p6');
        if (statAmount < 1n) {
            message.reply('You need the **Statistician** donator item to use this command! Check `~dshop`.');
            return;
        }

        if (!amountArg) {
            message.reply('Usage: `~purchase <amount> <stock_type>`');
            return;
        }

        const stockDef = stockTypes[stockType];
        if (!stockDef) {
            message.reply('Invalid stock type! Use `~stocks` to see available stocks.');
            return;
        }

        const user = await getUser(userId);
        const userBalance = BigInt(user.balance);

        let purchaseAmount: bigint;
        if (amountArg === 'all' || amountArg === 'max') {
            purchaseAmount = userBalance / stockDef.price;
        } else {
            try {
                purchaseAmount = BigInt(amountArg.replace(/,/g, ''));
            } catch {
                message.reply('Invalid amount! Use a number or `all`.');
                return;
            }
        }

        if (purchaseAmount <= 0n) {
            message.reply('Amount must be greater than 0!');
            return;
        }

        const totalCost = purchaseAmount * stockDef.price;

        if (totalCost > userBalance) {
            message.reply(`You don't have enough money! Cost: 💵 ${totalCost.toLocaleString()}`);
            return;
        }

        // Deduct balance
        const newBalance = userBalance - totalCost;
        await db.execute({
            sql: 'UPDATE users SET balance = ? WHERE id = ?',
            args: [newBalance.toString(), userId]
        });

        // Add shares
        const currentStock = await db.execute({
            sql: 'SELECT shares FROM stocks WHERE user_id = ? AND stock_type = ?',
            args: [userId, stockType]
        });
        const row = currentStock.rows[0] as any;
        const currentShares = row ? BigInt(row.shares) : 0n;
        const newShares = currentShares + purchaseAmount;

        await db.execute({
            sql: 'INSERT INTO stocks (user_id, stock_type, shares) VALUES (?, ?, ?) ON CONFLICT(user_id, stock_type) DO UPDATE SET shares = ?',
            args: [userId, stockType, newShares.toString(), newShares.toString()]
        });

        const embed = new EmbedBuilder()
            .setDescription(`${message.author.username} (@${message.author.username}) has purchased ${purchaseAmount.toLocaleString()} ${resolveEmoji(client, stockDef.emoji)} ${stockDef.name} shares for 💵 ${totalCost.toLocaleString()}! \`~shares\``)
            .setColor(getUserColor(userId));

        message.reply({ embeds: [embed] });
    },
};

export default command;
