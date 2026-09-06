import db from './db';
import { addInventoryItem } from './inventory';

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

/**
 * Odds of a Vault Token dropping from an activity.
 *
 * PvE activities (mining, hunting, harvesting, grabbing wallets) are the
 * intended source. PvP can also yield them but at a much lower rate, and
 * silently — `~shoot` and `~beatup` never mention the drop.
 */
export const VAULT_TOKEN_CHANCE_PVE = 0.15;
export const VAULT_TOKEN_CHANCE_PVP = 0.02;

/** Rolls for a Vault Token, awarding one on success. Returns whether it hit. */
export async function rollVaultToken(userId: string, chance: number): Promise<boolean> {
    if (Math.random() >= chance) return false;
    await addInventoryItem(userId, VAULT_TOKEN_ITEM, 1n);
    return true;
}

const BASE_DIGITS = 5;
const BASE_UPGRADE_COST = 6;

/** Highest tier a vault can reach. Raised T20 -> T200 by the vault rework. */
export const MAX_VAULT_TIER = 200;

/**
 * Extra capacity digits granted by a Gold membership.
 *
 * The reference bot splits this: Gold is +20 digits and a SlotHub booster is
 * +5. This bot only has the one `is_premium` flag, which both the booster
 * handler and ~givepremium set, so the two cannot be told apart here and
 * everyone holding it gets the Gold number.
 */
const GOLD_BONUS_DIGITS = 20;

/** Cut taken when withdrawing, halved for Gold members. */
const WITHDRAW_TAX_PERCENT = 5n;
const WITHDRAW_TAX_PERCENT_GOLD = 2n;

/** Capacity in digits for a tier. Tier 1 -> 6 digits. */
export function capacityDigits(tier: number): number {
    return BASE_DIGITS + Math.max(1, tier);
}

async function isGoldMember(userId: string): Promise<boolean> {
    const result = await db.execute({
        sql: 'SELECT is_premium FROM users WHERE id = ?',
        args: [userId]
    });
    const row = result.rows[0] as any;
    return Boolean(row && Number(row.is_premium) === 1);
}

/** Capacity digits including the Gold bonus, which deposits must respect. */
export async function capacityDigitsForUser(userId: string, tier: number): Promise<number> {
    const bonus = (await isGoldMember(userId)) ? GOLD_BONUS_DIGITS : 0;
    return capacityDigits(tier) + bonus;
}

/** Largest amount this user's vault can hold, Gold bonus included. */
export async function vaultCapacityForUser(userId: string, tier: number): Promise<bigint> {
    return 10n ** BigInt(await capacityDigitsForUser(userId, tier)) - 1n;
}

/**
 * Splits a gross withdrawal into what the user receives and what the tax eats.
 *
 * `gross` is the amount leaving the vault, so the balance only ever gains
 * `net`. Callers that mean "withdraw everything" pass the full vault and let
 * the tax come off the top rather than trying to gross the figure up.
 */
export async function applyWithdrawTax(userId: string, gross: bigint): Promise<{ net: bigint; tax: bigint }> {
    const percent = (await isGoldMember(userId)) ? WITHDRAW_TAX_PERCENT_GOLD : WITHDRAW_TAX_PERCENT;
    const tax = (gross * percent) / 100n;
    return { net: gross - tax, tax };
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
