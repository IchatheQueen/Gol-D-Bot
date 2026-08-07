import db from './db';

/**
 * Check if a user has an active drug effect
 */
export async function hasActiveDrugEffect(userId: string, drugType: string): Promise<boolean> {
    const result = await db.execute({
        sql: 'SELECT * FROM drug_effects WHERE user_id = ? AND drug_type = ? AND expires_at > ?',
        args: [userId, drugType, Date.now()]
    });
    return result.rows.length > 0;
}

/**
 * Get active drug effect expiration time
 */
export async function getDrugEffectExpiry(userId: string, drugType: string): Promise<number | null> {
    const result = await db.execute({
        sql: 'SELECT expires_at FROM drug_effects WHERE user_id = ? AND drug_type = ? AND expires_at > ?',
        args: [userId, drugType, Date.now()]
    });
    const row = result.rows[0] as any;
    return row ? Number(row.expires_at) : null;
}

/**
 * Clean up expired drug effects
 */
export async function cleanupExpiredEffects(userId: string): Promise<void> {
    await db.execute({
        sql: 'DELETE FROM drug_effects WHERE user_id = ? AND expires_at <= ?',
        args: [userId, Date.now()]
    });
}

/**
 * Get cooldown multiplier based on active drug effects
 * - Opioid: 0.5 (halves cooldowns)
 * - Steroid: 0.25 (3/4 reduction)
 */
export async function getCooldownMultiplier(userId: string): Promise<number> {
    await cleanupExpiredEffects(userId);

    if (await hasActiveDrugEffect(userId, 'ster')) {
        return 0.25; // 3/4 reduction
    }
    if (await hasActiveDrugEffect(userId, 'opi')) {
        return 0.5; // Half cooldowns
    }
    return 1.0; // No reduction
}

/**
 * Check if user is immune to attacks (Opioid or Anesthesia active)
 */
export async function isImmuneToAttacks(userId: string, attackType: string): Promise<boolean> {
    await cleanupExpiredEffects(userId);

    // Anesthesia makes you immune to everything
    if (await hasActiveDrugEffect(userId, 'anes') || await hasActiveDrugEffect(userId, 'copium')) {
        return true;
    }

    // Opioid makes you immune to: Beatup, Rifle, Pistol, Crossbow
    const opioidImmune = ['beatup', 'rifle', 'pistol', 'crossbow'];
    if (await hasActiveDrugEffect(userId, 'opi') && opioidImmune.includes(attackType.toLowerCase())) {
        return true;
    }

    // Steroid makes you immune to: Hex, Boost
    const steroidImmune = ['hex', 'boost'];
    if (await hasActiveDrugEffect(userId, 'ster') && steroidImmune.includes(attackType.toLowerCase())) {
        return true;
    }

    return false;
}

/**
 * Check if LSD effect causes command failure (1/3 chance)
 */
export async function lsdCommandFails(userId: string): Promise<boolean> {
    if (await hasActiveDrugEffect(userId, 'lsd')) {
        return Math.random() < 0.33;
    }
    return false;
}

/**
 * Add a drug effect to a user
 */
export async function addDrugEffect(userId: string, drugType: string, durationMs: number): Promise<void> {
    const expiresAt = Date.now() + durationMs;
    await db.execute({
        sql: 'INSERT OR REPLACE INTO drug_effects (user_id, drug_type, expires_at) VALUES (?, ?, ?)',
        args: [userId, drugType, expiresAt]
    });
}
