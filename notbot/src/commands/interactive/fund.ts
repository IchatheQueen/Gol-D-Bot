
import { Message, Client, EmbedBuilder } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';
import { getUserColor } from '../../database/userColor';
import { sqrtBigInt } from '../../utils/bigMath';
import { formatBigNumber } from '../../utils/bigNumbers';

const command: Command = {
    name: 'fund',
    description: 'Fund your Pill Generator',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;
        const amountArg = args[0];

        if (!amountArg) {
            message.reply('Please specify an amount to fund or use `allmoney`.');
            return;
        }

        // Check generator existence
        let generatorCheck = await db.execute({
            sql: 'SELECT * FROM generators WHERE user_id = ?',
            args: [userId]
        });

        if (generatorCheck.rows.length === 0) {
            await db.execute({ sql: 'INSERT INTO generators (user_id) VALUES (?)', args: [userId] });
            generatorCheck = await db.execute({ sql: 'SELECT * FROM generators WHERE user_id = ?', args: [userId] });
        }
        const gen = generatorCheck.rows[0] as any;

        // Get user balance
        const userCheck = await db.execute({ sql: 'SELECT balance FROM users WHERE id = ?', args: [userId] });
        const balanceStr = (userCheck.rows[0] as any)?.balance || '0';
        const balance = BigInt(balanceStr);

        let fundAmount = 0n;

        if (['all', 'allmoney', 'max'].includes(amountArg.toLowerCase())) {
            fundAmount = balance;
        } else {
            // Parse amount
            const cleaned = amountArg.replace(/[,\s]/g, '');
            if (!/^\d+$/.test(cleaned)) {
                message.reply('Invalid amount.');
                return;
            }
            fundAmount = BigInt(cleaned);
        }

        if (fundAmount <= 0n) {
            message.reply('You can\'t fund 0 or negative amounts.');
            return;
        }

        if (fundAmount > balance) {
            message.reply('You don\'t have enough money.');
            return;
        }

        // Calculate levels purchasable using iterative exponential growth (3x per level)
        // Base cost for Level 1 -> 2 is 900.
        // Cost(L) = 900 * 3^(L-1)

        const currentLevel = BigInt(gen.level);
        let level = Number(currentLevel);

        let nextLevelCost = 900n;
        // Fast forward to current level cost
        for (let i = 1; i < level; i++) {
            nextLevelCost = nextLevelCost * 3n;
        }

        let levelsPurchased = 0n;
        let totalCost = 0n;
        let remainingFund = fundAmount;

        // Iterate to buy levels
        while (remainingFund >= nextLevelCost) {
            remainingFund -= nextLevelCost;
            totalCost += nextLevelCost;
            levelsPurchased++;
            level++;
            nextLevelCost *= 3n;
        }

        if (levelsPurchased === 0n) {
            message.reply(`Not enough money to fund even 1 level. Next level costs 💵 ${formatBigNumber(nextLevelCost)}`);
            return;
        }

        // Credits gained = levels purchased
        const creditsGained = levelsPurchased;
        const newLevel = currentLevel + levelsPurchased;

        // Update DB
        const newBalance = balance - totalCost;

        // Transaction
        await db.execute({
            sql: 'UPDATE users SET balance = ? WHERE id = ?',
            args: [newBalance.toString(), userId]
        });

        await db.execute({
            sql: 'UPDATE generators SET level = ?, invested = invested + ?, credits = credits + ? WHERE user_id = ?',
            args: [newLevel.toString(), totalCost.toString(), creditsGained.toString(), userId]
        });

        // Format large number match: "2,499,999... (139 digits)"
        const costStr = totalCost.toString();
        let formattedCost = '';
        if (costStr.length > 21) {
            const formatted = formatBigNumber(totalCost);
            // If formatBigNumber returns truncated form, adapt it or use simple truncation if formatBigNumber doesn't support the specific ...(N digits) format in exact style
            if (formatted.includes('&')) {
                const [visible, hiddenCount] = formatted.split('&');
                const totalDigits = costStr.length;
                formattedCost = `${visible}... (${totalDigits} digits)`;
            } else {
                formattedCost = formatted;
            }
        } else {
            formattedCost = formatBigNumber(totalCost);
        }

        const embed = new EmbedBuilder()
            .setDescription(
                `${message.author.username} (@${message.author.username}) has dedicated 💵 ${formattedCost} ` +
                `to funding their 🗜️ and raised it up to level ${newLevel}, gaining 🏵️ ${creditsGained} in the process`
            )
            .setColor(getUserColor(userId));

        await message.reply({ embeds: [embed] });
    }
};

export default command;
