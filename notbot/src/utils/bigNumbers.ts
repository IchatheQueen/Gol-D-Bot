/**
 * Parse a large number string into BigInt
 * Handles commas, spaces, and validates input
 */
export function parseBigNumber(input: string): bigint | null {
    if (!input) return null;

    // Remove commas and spaces
    let cleaned = input.toLowerCase().replace(/[,\s]/g, '');

    // Handle X&Y notation (trailing zeros)
    if (cleaned.includes('&')) {
        const parts = cleaned.split('&');
        if (parts.length === 2 && /^\d+$/.test(parts[0]) && /^\d+$/.test(parts[1])) {
            try {
                const base = BigInt(parts[0]);
                const exponent = parseInt(parts[1]);
                if (exponent < 0) return null;
                if (exponent > 10000) return null;
                return base * (10n ** BigInt(exponent));
            } catch {
                return null;
            }
        }
    }

    const multipliers: Record<string, bigint> = {
        'k': 1000n,
        'm': 1000000n,
        'b': 1000000000n,
        't': 1000000000000n,
        'q': 1000000000000000n
    };

    const suffix = cleaned[cleaned.length - 1];
    if (multipliers[suffix]) {
        const numStr = cleaned.slice(0, -1);
        // Handle decimals like 1.5M
        if (/^\d+(\.\d+)?$/.test(numStr)) {
            const val = parseFloat(numStr);
            return BigInt(Math.floor(val * Number(multipliers[suffix])));
        }
    }

    // Handle scientific notation (e.g. 1e10 or 1e+10)
    if (cleaned.includes('e')) {
        try {
            const num = parseFloat(cleaned);
            if (isFinite(num)) {
                // toLocaleString is risky for precision, use BigInt constructor on scientific notation if possible?
                // Actually, BigInt doesn't support scientific strings.
                // We'll use the decimal expansion.
                const intStr = num.toLocaleString('fullwide', { useGrouping: false }).split('.')[0];
                return BigInt(intStr);
            }
        } catch { }
    }

    // Final fallback: direct BigInt conversion of cleaned digit string
    const digitsOnly = cleaned.replace(/\D/g, '');
    if (!digitsOnly) return null;
    try {
        return BigInt(digitsOnly);
    } catch {
        return null;
    }
}

/**
 * Format a BigInt or large number for display
 * Under 21 digits: full number with commas
 * Over 21 digits: shows first 21 digits with commas, then (TotalDigits digits)
 */
export function formatBigNumber(amount: bigint | number | string, options: { full?: boolean } = {}): string {
    const numStr = amount.toString().replace(/[^0-9-]/g, '');
    const isNegative = numStr.startsWith('-');
    const absNumStr = isNegative ? numStr.slice(1) : numStr;
    const digitCount = absNumStr.length;

    const addCommas = (s: string) => s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    if (digitCount <= 21 || options.full) {
        return (isNegative ? '-' : '') + addCommas(absNumStr);
    }

    const first21 = absNumStr.slice(0, 21);
    return (isNegative ? '-' : '') + `${addCommas(first21)}... (${digitCount} digits)`;
}

/**
 * Format a number using shorthand (k, m, b, t, q)
 * Used for XP denominators and compact UI
 */
export function formatShorthand(amount: bigint | number | string): string {
    const big = BigInt(amount.toString().replace(/[^0-9-]/g, '') || '0');
    const abs = big < 0n ? -big : big;

    if (abs < 1000n) return big.toString();

    const units = [
        { suffix: 'k', value: 1000n },
        { suffix: 'm', value: 1000000n },
        { suffix: 'b', value: 1000000000n },
        { suffix: 't', value: 1000000000000n },
        { suffix: 'q', value: 1000000000000000n }
    ];

    let unit = units[0];
    for (const u of units) {
        if (abs >= u.value) unit = u;
        else break;
    }

    const val = Number(abs * 1000n / unit.value) / 1000;
    const formatted = val % 1 === 0 ? val.toFixed(0) : val.toString();
    return (big < 0n ? '-' : '') + formatted + unit.suffix;
}

/**
 * Add two potentially large numbers (stored as strings in DB)
 */
export function addBigNumbers(a: string | number | bigint, b: string | number | bigint): string {
    const bigA = BigInt(a.toString().replace(/[^0-9-]/g, '') || '0');
    const bigB = BigInt(b.toString().replace(/[^0-9-]/g, '') || '0');
    return (bigA + bigB).toString();
}

/**
 * Subtract two potentially large numbers
 */
export function subtractBigNumbers(a: string | number | bigint, b: string | number | bigint): string {
    const bigA = BigInt(a.toString().replace(/[^0-9-]/g, '') || '0');
    const bigB = BigInt(b.toString().replace(/[^0-9-]/g, '') || '0');
    return (bigA - bigB).toString();
}
