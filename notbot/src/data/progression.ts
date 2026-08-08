/**
 * Shared progression limits for cats and generators.
 *
 * These are caps rather than tuning knobs — several commands need to agree on
 * them, and they drifting apart is what previously let stats scale past the
 * point the rest of the balance was designed around.
 */

/**
 * Highest level a cat can reach. Experience keeps accruing past this point,
 * the cat simply stops levelling, so content can be balanced against a known
 * ceiling instead of an open-ended one.
 */
export const MAX_CAT_LEVEL = 30;

/** Generator credits granted per cat level up. */
export const GEN_CREDITS_PER_LEVEL = 10;

/**
 * Ceiling on generator credits. Efficiency stops counting past this too —
 * letting it scale freely was a real performance problem, not just a balance
 * one.
 */
export const MAX_GEN_CREDITS = 300;
