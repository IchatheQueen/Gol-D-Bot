import db from '../db';

/**
 * Adds the vault tier column backing the money vault.
 *
 * Deliberately does NOT touch existing `credits` balances. That column was
 * doing double duty as both the old vault currency and the paid donator
 * currency, so there is no way to tell earned-by-deposit credits from
 * legitimately purchased ones. Zeroing it would destroy real donator credit,
 * so existing balances are left alone; the exploit is closed going forward
 * because ~deposit no longer mints credits.
 */
export async function run() {
    try {
        await db.execute('ALTER TABLE users ADD COLUMN vault_tier INTEGER DEFAULT 1');
    } catch {
        // Column already exists.
    }
}
