import { Message, Client, EmbedBuilder } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';
import { getUser, updateUser } from '../../database/economy';
import { getInventoryItem } from '../../database/inventory';
import { getUserColor } from '../../database/userColor';
import { parseBigNumber, formatBigNumber } from '../../utils/bigNumbers';

// Stock types
const stockTypes: Record<number, { name: string; emoji: string }> = {
    1: { name: 'Casino', emoji: '🎰' },
};

const command: Command = {
    name: 'sell',
    description: 'Sell your stock shares',
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
            message.reply('Usage: `~sell <amount|allshares> <stock_type>`');
            return;
        }

        const stockDef = stockTypes[stockType];
        if (!stockDef) {
            message.reply('Invalid stock type! Use `~stocks` to see available stocks.');
            return;
        }

        // Get current shares
        const currentStock = await db.execute({
            sql: 'SELECT shares FROM stocks WHERE user_id = ? AND stock_type = ?',
            args: [userId, stockType]
        });
        const row = currentStock.rows[0] as any;
        const currentShares = row ? BigInt(row.shares) : 0n;

        if (currentShares <= 0n) {
            message.reply(`You don't own any ${stockDef.name} shares!`);
            return;
        }

        let sellAmount: bigint;
        if (amountArg === 'allshares' || amountArg === 'all') {
            sellAmount = currentShares;
        } else {
            sellAmount = parseBigNumber(amountArg) || 0n;
        }

        if (sellAmount <= 0n) {
            message.reply('Amount must be greater than 0!');
            return;
        }

        if (sellAmount > currentShares) {
            message.reply(`You only have ${formatBigNumber(currentShares)} ${stockDef.name} shares!`);
            return;
        }

        // Calculate sell value
        const sellValue = sellAmount * 90n; // Price per share

        // Update shares
        const newShares = currentShares - sellAmount;
        await db.execute({
            sql: 'INSERT INTO stocks (user_id, stock_type, shares) VALUES (?, ?, ?) ON CONFLICT(user_id, stock_type) DO UPDATE SET shares = ?',
            args: [userId, stockType, newShares.toString(), newShares.toString()]
        });

        // Add balance
        const user = await getUser(userId);
        await updateUser(userId, { balance: user.balance + sellValue });

        const embed = new EmbedBuilder()
            .setDescription(`${message.author.username} (@${message.author.username}) has sold ${formatBigNumber(sellAmount)} ${stockDef.name} shares. \`~shares\``)
            .setColor(getUserColor(userId));

        message.reply({ embeds: [embed] });
    },
};

export default command;
