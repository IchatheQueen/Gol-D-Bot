import { Message, Client, EmbedBuilder } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';
import { getUser, adjustFunds } from '../../database/economy';
import { getUserColor } from '../../database/userColor';
import { parseBigNumber, formatBigNumber } from '../../utils/bigNumbers';
import { userTag } from '../../utils/userTag';

const CHAMBERS = 6;
const STUN_MINUTES = 5;

/**
 * Russian roulette. `~rr <bullets 1-5> <bet>`.
 *
 * Survival odds are (6 - bullets) / 6, so the fair multiplier on the stake is
 * 6 / (6 - bullets): 1 bullet pays 1.2x, 5 bullets pays 6x. HOUSE_EDGE shaves
 * a little off so the game is not break-even in expectation.
 */
const HOUSE_EDGE_PERCENT = 5n;

const command: Command = {
    name: 'rr',
    description: 'Play russian roulette for a payout — or get stunned',
    usage: '~rr <bullets 1-5> <bet>',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;

        const bullets = parseInt(args[0], 10);
        const betArg = args[1];

        if (!Number.isInteger(bullets) || bullets < 1 || bullets > 5 || !betArg) {
            message.reply('Invalid Arguments! Valid usage is `~rr <bullets 1-5> <bet>`');
            return;
        }

        const user = await getUser(userId);

        let bet: bigint;
        if (betArg.toLowerCase() === 'all') {
            bet = user.balance;
        } else {
            bet = parseBigNumber(betArg) ?? 0n;
        }

        if (bet <= 0n) {
            message.reply('Please specify a valid bet.');
            return;
        }

        // Take the stake up front so concurrent spins can't reuse it.
        const staked = await adjustFunds(userId, { balance: -bet });

        if (!staked) {
            message.reply('You do not have enough money in your wallet.');
            return;
        }

        const survived = Math.floor(Math.random() * CHAMBERS) >= bullets;

        if (!survived) {
            const expiresAt = Date.now() + STUN_MINUTES * 60 * 1000;
            await db.execute({
                sql: 'INSERT OR REPLACE INTO stuns (user_id, expires_at, reason, issued_by) VALUES (?, ?, ?, ?)',
                args: [userId, expiresAt, 'Russian Roulette', userId]
            });

            const lostEmbed = new EmbedBuilder()
                .setDescription(
                    `${userTag(message)} loaded ${bullets} round(s), pulled the trigger and lost 💵 ${formatBigNumber(bet)}\n` +
                    `└ They are out cold for ${STUN_MINUTES} minutes 🪦`
                )
                .setColor(getUserColor(userId));

            message.reply({ embeds: [lostEmbed] });
            return;
        }

        // Payout is the stake back plus winnings, minus the house edge.
        const gross = (bet * BigInt(CHAMBERS)) / BigInt(CHAMBERS - bullets);
        const payout = gross - (gross * HOUSE_EDGE_PERCENT) / 100n;
        const profit = payout - bet;

        await adjustFunds(userId, { balance: payout });

        const wonEmbed = new EmbedBuilder()
            .setDescription(
                `${userTag(message)} loaded ${bullets} round(s), pulled the trigger and survived\n` +
                `└ 💵 ${formatBigNumber(profit)} won`
            )
            .setColor(getUserColor(userId));

        message.reply({ embeds: [wonEmbed] });
    },
};

export default command;
