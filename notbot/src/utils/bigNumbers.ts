/**
 * Parse a large number string into BigInt
 * Handles commas, spaces, and validates input
 */
export function parseBigNumber(input: string): bigint | null {
    if (!input) return null;

    // Remove commas and spaces
    const cleaned = input.replace(/[,\s]/g, '');

    // Validate it's a valid number
    if (!/^\d+$/.test(cleaned)) {
        return null;
    }

    try {
        return BigInt(cleaned);
    } catch {
        return null;
    }
}

/**
 * Format a BigInt or large number for display
 * Under 21 digits: full number with commas
 * Over 21 digits: shows first 21 digits with commas, then &X where X is hidden digit count
 * Example: 123,456,789,012,345,678,901&120 (21 shown + 120 hidden = 141 total)
 */
export function formatBigNumber(amount: bigint | number | string): string {
    const numStr = amount.toString().replace(/[^0-9-]/g, '');
    const isNegative = numStr.startsWith('-');
    const absNumStr = isNegative ? numStr.slice(1) : numStr;
    const digitCount = absNumStr.length;

    // Add commas to a string
    const addCommas = (s: string) => s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    if (digitCount <= 21) {
        return (isNegative ? '-' : '') + addCommas(absNumStr);
    }

    // Over 21 digits - show first 21 digits with commas, then (TotalDigits digits)
    const first21 = absNumStr.slice(0, 21);
    // const hiddenCount = digitCount - 21; // Unused now
    return (isNegative ? '-' : '') + `${addCommas(first21)}... (${digitCount} digits)`;
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
