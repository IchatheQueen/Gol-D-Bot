/**
 * Format a BigInt or large number for display
 * Under 21 digits: full number with commas
 * Over 21 digits: shows first 21 digits with commas, then (TotalDigits digits)
 * Example: 123,456... (134 digits)
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
    return (isNegative ? '-' : '') + `${addCommas(first21)}... (${digitCount} digits)`;
}
