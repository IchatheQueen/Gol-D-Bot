import { Client } from 'discord.js';

const BOT_OWNER_ID = '1331780893995565148';
const MAX_DIGITS = 141;

/**
 * Formats a number for display
 * - Under 21 digits: shows full number with commas
 * - 21-141 digits: shows first 21 digits + "... (X digits)"
 * - Over 141 digits: alerts bot owner
 */
export function formatCurrency(amount: number | bigint | string, client?: Client, userId?: string): string {
    const numStr = amount.toString().replace(/[^0-9-]/g, '');
    const isNegative = numStr.startsWith('-');
    const absNumStr = isNegative ? numStr.slice(1) : numStr;
    const digitCount = absNumStr.length;

    // Check if over max limit (141 digits)
    if (digitCount > MAX_DIGITS && client && userId) {
        alertOwner(client, userId, digitCount);
    }

    // Under 21 digits - show full number with commas
    if (digitCount <= 21) {
        const num = typeof amount === 'bigint' ? amount : BigInt(numStr);
        return (isNegative ? '-' : '') + formatWithCommas(absNumStr);
    }

    // Over 21 digits - truncate and show digit count
    const truncated = absNumStr.slice(0, 21);
    return (isNegative ? '-' : '') + formatWithCommas(truncated) + `... (${digitCount} digits)`;
}

/**
 * Add commas to a number string
 */
function formatWithCommas(numStr: string): string {
    return numStr.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Alert bot owner about excessive balance
 */
async function alertOwner(client: Client, userId: string, digitCount: number) {
    try {
        const owner = await client.users.fetch(BOT_OWNER_ID);
        if (owner) {
            await owner.send(`⚠️ **Balance Alert**\nUser <@${userId}> (${userId}) has a balance exceeding ${MAX_DIGITS} digits!\nCurrent digit count: **${digitCount}**`);
        }
    } catch (error) {
        console.error('Failed to alert owner:', error);
    }
}

/**
 * Quick format without client (no owner alert)
 */
export function formatNum(amount: number | bigint | string): string {
    return formatCurrency(amount);
}
