
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

        // Calculate levels purchasable
        // Cost for next k levels from current Level L:
        // C = 450 * (2kL + k^2 - k)
        // We need to solve for k given Cost <= fundAmount (Let's call it M)
        // k^2 + (2L - 1)k - M/450 = 0
        // k = ( -(2L-1) + sqrt( (2L-1)^2 - 4(1)(-M/450) ) ) / 2
        // k = ( 1 - 2L + sqrt( (2L-1)^2 + 4M/450 ) ) / 2
        // k = ( 1 - 2L + sqrt( (2L-1)^2 + 8M/900 ) ) / 2  <-- Wait 4/450 = 8/900? No. 4/450 is 2/225.
        // Let's use BigInt math.

        const L = BigInt(gen.level);
        const M = fundAmount;

        // Term inside sqrt: (2L-1)^2 + 4 * (M / 450)
        // Integer division M/450 might lose precision if M is small and remainder matters? 
        // Better: 450 * (k^2 + (2L-1)k) <= M.
        // 450k^2 + 450(2L-1)k - M <= 0.
        // Quadratic: a = 450, b = 450(2L-1), c = -M.
        // k = (-b + sqrt(b^2 - 4ac)) / 2a

        const a = 450n;
        const b = 450n * (2n * L - 1n);
        const c = -M;

        const b2 = b * b;
        const ac4 = 4n * a * c; // This is negative, so b^2 - 4ac becomes b^2 + |4ac|
        const discriminant = b2 - ac4;

        const sqrtD = sqrtBigInt(discriminant);
        const numerator = -b + sqrtD;
        const denominator = 2n * a;

        let k = numerator / denominator; // Integer division floors it, which is effectively what we want (max integer k)

        // Safety check if k < 0 (shouldn't happen if M > 0)
        if (k < 0n) k = 0n;

        // Calculate exact cost for k levels to deduce from balance
        // Cost = 450 * (k^2 + (2L-1)k)
        const cost = 450n * (k * k + (2n * L - 1n) * k);

        if (k === 0n) {
            message.reply(`Not enough money to fund even 1 level. Next level costs 💵 ${formatBigNumber(L * 900n)}`);
            return;
        }

        // Credits gained = k (1 per level)
        const creditsGained = k;
        const newLevel = L + k;

        // Update DB
        // Deduct money, update generator
        const newBalance = balance - cost; // Actually we deduced 'cost'. But user said 'fund allmoney'. 
        // If 'allmoney' was used, usually games take strictly what's needed for max levels, leaving change. 
        // Screenshot: "dedicated ... (139 digits)". It seems to imply the Full Amount was dedicated? 
        // "and raised it up to level 285". 
        // If I use 'cost', I leave change. If I use 'fundAmount' (all balance), I might overcharge if exact logic is different.
        // Usually 'fund' implies paying into explicit levels. 
        // I will deduct 'cost' to be safe and accurate to the game logic derived. 
        // The screenshot text "dedicated [Amount]" matches the COST, or the INPUT?
        // Likely the COST paid.

        // Transaction
        await db.execute({
            sql: 'UPDATE users SET balance = ? WHERE id = ?',
            args: [newBalance.toString(), userId]
        });

        await db.execute({
            sql: 'UPDATE generators SET level = ?, invested = invested + ?, credits = credits + ? WHERE user_id = ?',
            args: [newLevel.toString(), cost.toString(), creditsGained.toString(), userId]
        });

        // Format large number match: "2,499,999... (139 digits)"
        const costStr = cost.toString();
        let formattedCost = '';
        if (costStr.length > 20) {
            const firstPart = costStr.slice(0, 15); // Screenshot "2,499,999,999..." looks like ~10-15 chars?
            const commafied = firstPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            formattedCost = `${commafied}... (${costStr.length} digits)`;
        } else {
            formattedCost = costStr.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
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
