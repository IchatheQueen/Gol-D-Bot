export function formatBigNumber(num: string | bigint | number): string {
    const n = typeof num === 'bigint' ? num : BigInt(num || 0);
    return n.toLocaleString('en-US');
}
