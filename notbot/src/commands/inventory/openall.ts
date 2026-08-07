import { Message, Client, EmbedBuilder } from 'discord.js';
import { Command } from '../../handlers/commandHandler';
import { getInventoryItem, adjustInventoryItem } from '../../database/inventory';
import { adjustFunds } from '../../database/economy';
import { getUserColor } from '../../database/userColor';
import { formatBigNumber } from '../../utils/bigNumbers';
import { userTag } from '../../utils/userTag';
import { TIPPED_ARROWS } from './tipped';

const BRIEFCASES = ['employee', 'richkid', 'oldlady', 'nitro', 'ender'] as const;

// Mirrors the per-briefcase money ranges used by ~open.
const MONEY_RANGES: Record<string, [number, number]> = {
    employee: [100, 1000],
    richkid: [1000, 10000],
    oldlady: [500, 5000],
    nitro: [10000, 100000],
    ender: [5000, 50000],
};

const command: Command = {
    name: 'openall',
    description: 'Opens all of your briefcase(s)',
    usage: '~openall <type of briefcase>',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;
        const typeArg = args[0]?.toLowerCase();

        if (!typeArg) {
            message.reply(`Usage: \`~openall <type of briefcase>\`\nAvailable: ${BRIEFCASES.join(', ')}, all`);
            return;
        }

        const types = typeArg === 'all'
            ? [...BRIEFCASES]
            : BRIEFCASES.includes(typeArg as any) ? [typeArg] : null;

        if (!types) {
            message.reply(`Invalid briefcase type! Available: ${BRIEFCASES.join(', ')}, all`);
            return;
        }

        let totalOpened = 0n;
        let totalMoney = 0n;
        const arrowsFound: Record<string, bigint> = {};

        for (const type of types) {
            const itemId = `${type}_briefcase`;
            const owned = await getInventoryItem(userId, itemId);
            if (owned < 1n) continue;

            // Take the whole stack up front so a concurrent ~open can't also
            // spend them.
            const taken = await adjustInventoryItem(userId, itemId, -owned);
            if (!taken) continue;

            totalOpened += owned;

            const [min, max] = MONEY_RANGES[type] || [100, 1000];
            for (let i = 0n; i < owned; i++) {
                totalMoney += BigInt(Math.floor(Math.random() * (max - min)) + min);

                // Employee cases can also carry a tipped arrow, as in ~open.
                if (type === 'employee' && Math.random() < 0.5) {
                    const droppable = TIPPED_ARROWS.filter(a => a.id !== 'tipped_normal' && !('perk' in a));
                    const arrow = droppable[Math.floor(Math.random() * droppable.length)];
                    arrowsFound[arrow.id] = (arrowsFound[arrow.id] ?? 0n) + 1n;
                }
            }
        }

        if (totalOpened === 0n) {
            message.reply("You don't have any briefcases of that type!");
            return;
        }

        await adjustFunds(userId, { balance: totalMoney });

        const lines = [`• 💵 ${formatBigNumber(totalMoney)}`];
        for (const [arrowId, count] of Object.entries(arrowsFound)) {
            await adjustInventoryItem(userId, arrowId, count);
            const arrow = TIPPED_ARROWS.find(a => a.id === arrowId)!;
            lines.push(`• ${arrow.emoji} ${formatBigNumber(count)} ${arrow.name}`);
        }

        const embed = new EmbedBuilder()
            .setDescription(
                `${userTag(message)} opened 💼 ${formatBigNumber(totalOpened)} briefcase(s) and found:\n` +
                lines.join('\n')
            )
            .setColor(getUserColor(userId));

        message.reply({ embeds: [embed] });
    },
};

export default command;
