import db from './db';

/**
 * The vault stores *money*, protected from theft, with a capacity expressed as
 * a number of digits. `~upgrade` spends Vault Tokens to add a digit.
 *
 * Reference behaviour: a fresh vault is "Money Vault [T1]" with
 * "Current Limit: 6 Digits" and "Upgrade Cost: 6 tokens needed".
 *
 * Note this is deliberately NOT the `credits` column. That column is the paid
 * donator currency read by ~dcred/~dbuy; the old deposit command minted it
 * from ordinary cash, which let anyone buy donator items with in-game money.
 */

/** Item id for Vault Tokens, sold in the Pub. */
export const VAULT_TOKEN_ITEM = 'vault_token';

const BASE_DIGITS = 5;
const BASE_UPGRADE_COST = 6;

/** Capacity in digits for a tier. Tier 1 -> 6 digits. */
export function capacityDigits(tier: number): number {
    return BASE_DIGITS + Math.max(1, tier);
}

/** Largest amount a tier can hold: 6 digits -> 999,999. */
export function vaultCapacity(tier: number): bigint {
    return 10n ** BigInt(capacityDigits(tier)) - 1n;
}

/** Vault Tokens needed to go from `tier` to `tier + 1`. */
export function upgradeCost(tier: number): number {
    return BASE_UPGRADE_COST * Math.max(1, tier);
}

/** Digits currently in use, which the vault display shows alongside the limit. */
export function digitsUsed(stored: bigint): number {
    return stored <= 0n ? 1 : stored.toString().length;
}

export async function getVaultTier(userId: string): Promise<number> {
    const result = await db.execute({
        sql: 'SELECT vault_tier FROM users WHERE id = ?',
        args: [userId]
    });
    const row = result.rows[0] as any;
    const tier = row ? Number(row.vault_tier) : 1;
    return Number.isFinite(tier) && tier > 0 ? tier : 1;
}

export async function setVaultTier(userId: string, tier: number): Promise<void> {
    await db.execute({
        sql: 'UPDATE users SET vault_tier = ? WHERE id = ?',
        args: [tier, userId]
    });
}
