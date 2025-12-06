
export function sqrtBigInt(n: bigint): bigint {
    if (n < 0n) {
        throw new Error("Square root of negative number is not supported");
    }
    if (n < 2n) {
        return n;
    }
    let x0 = n;
    let x1 = (x0 + n / x0) >> 1n;
    while (x1 < x0) {
        x0 = x1;
        x1 = (x0 + n / x0) >> 1n;
    }
    return x0;
}
