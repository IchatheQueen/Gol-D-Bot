
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

        // Fetch generator data
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
        const user = await db.execute({ sql: 'SELECT balance FROM users WHERE id = ?', args: [userId] });
        const balance = BigInt((user.rows[0] as any)?.balance || '0');

        let fundAmount = 0n;
        if (['all', 'allmoney', 'max'].includes(amountArg.toLowerCase())) {
            fundAmount = balance;
        } else {
            fundAmount = parseBigNumber(amountArg) || 0n;
        }

        if (fundAmount <= 0n) { message.reply('Invalid amount.'); return; }
        if (fundAmount > balance) { message.reply('Insufficient funds.'); return; }

        let currentLevel = gen.level;
        let totalInvested = BigInt(gen.invested || '0');
        let remainingFund = fundAmount;
        let levelsGained = 0;
        let spent = 0n;

        // Formula: 900 * 3^(L-1)
        while (true) {
            let cost = 900n;
            for (let i = 1; i < currentLevel; i++) cost *= 3n;

            const needed = cost - totalInvested;
            if (remainingFund >= needed) {
                remainingFund -= needed;
                spent += needed;
                currentLevel++;
                totalInvested = 0n;
                levelsGained++;
            } else {
                totalInvested += remainingFund;
                spent += remainingFund;
                remainingFund = 0n;
                break;
            }
        }

        // Update DB
        await db.execute({
            sql: 'UPDATE users SET balance = (CAST(balance AS TEXT)) WHERE id = ?', // cast check
            args: [userId]
        });
        // Real update
        await db.execute({ sql: 'UPDATE users SET balance = ? WHERE id = ?', args: [(balance - spent).toString(), userId] });
        await db.execute({
            sql: 'UPDATE generators SET level = ?, invested = ?, credits = credits + ? WHERE user_id = ?',
            args: [currentLevel, totalInvested.toString(), levelsGained, userId]
        });

        const formattedCost = formatBigNumber(spent, { full: true });
        const embed = new EmbedBuilder()
            .setDescription(`${message.author.username} (@${message.author.username}) has dedicated 💵 ${formattedCost} to funding their 🗜️ and raised it up to level ${currentLevel}, gaining 🏵️ ${levelsGained} in the process`)
            .setColor('#2b2d31');

        message.reply({ embeds: [embed] });
    },
};

export default command;
