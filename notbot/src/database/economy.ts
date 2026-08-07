import db from './db';

// Safe BigInt conversion that handles scientific notation from database
const safeBigInt = (value: any): bigint => {
    if (value === null || value === undefined) return 0n;
    if (typeof value === 'bigint') return value;
    if (typeof value === 'string') {
        // Handle scientific notation in strings
        if (value.includes('e') || value.includes('E')) {
            const num = parseFloat(value);
            if (!isFinite(num)) return 0n;
            const intStr = num.toLocaleString('fullwide', { useGrouping: false }).split('.')[0];
            return BigInt(intStr);
        }
        return BigInt(value || '0');
    }
    if (typeof value === 'number') {
        if (!isFinite(value)) return 0n;
        const intStr = value.toLocaleString('fullwide', { useGrouping: false }).split('.')[0];
        return BigInt(intStr);
    }
    return 0n;
};

export interface UserData {
    id: string;
    balance: bigint;
    vault: bigint;
    pills: number;
    credits: bigint;
    selected_weapon: string;
    selected_arrow: string;
}

export const defaultUser: UserData = {
    id: '',
    balance: 0n,
    vault: 0n,
    pills: 0,
    credits: 0n,
    selected_weapon: 'pistol',
    selected_arrow: 'arrow_normal',
};

export const getUser = async (userId: string): Promise<UserData> => {
    const result = await db.execute({
        sql: 'SELECT * FROM users WHERE id = ?',
        args: [userId]
    });

    const row = result.rows[0] as any;

    if (!row) {
        await db.execute({
            sql: 'INSERT INTO users (id) VALUES (?)',
            args: [userId]
        });
        return { ...defaultUser, id: userId };
    }

    return {
        id: row.id,
        balance: safeBigInt(row.balance),
        vault: safeBigInt(row.vault),
        pills: row.pills || 0,
        credits: safeBigInt(row.credits),
        selected_weapon: row.selected_weapon || 'pistol',
        selected_arrow: row.selected_arrow || 'arrow_normal',
    };
};

export const updateUser = async (userId: string, data: Partial<UserData>) => {
    // Convert BigInts to strings for DB storage
    const dbData: any = { ...data };
    if (data.balance !== undefined) dbData.balance = data.balance.toString();
    if (data.vault !== undefined) dbData.vault = data.vault.toString();
    if (data.credits !== undefined) dbData.credits = data.credits.toString();

    const fields = Object.keys(dbData);
    const setClause = fields.map((key) => `${key} = ?`).join(', ');
    const values = fields.map((key) => dbData[key]);

    await db.execute({
        sql: `UPDATE users SET ${setClause} WHERE id = ?`,
        args: [...values, userId]
    });
};

export type CurrencyField = 'balance' | 'vault' | 'credits';

const CURRENCY_FIELDS: CurrencyField[] = ['balance', 'vault', 'credits'];
const CAS_MAX_ATTEMPTS = 12;

/**
 * Jittered backoff between compare-and-swap retries. Without it, everyone who
 * lost a round re-reads at the same instant and collides again, so contenders
 * starve out their retry budget instead of taking turns.
 */
export const casBackoff = (attempt: number): Promise<void> => {
    const ceiling = Math.min(2 ** attempt, 32);
    return new Promise(resolve => setTimeout(resolve, Math.random() * ceiling));
};

/**
 * Applies signed deltas to a user's currency fields atomically.
 *
 * Balances are stored as TEXT because they routinely exceed SQLite's 64-bit
 * INTEGER range, so we cannot do the arithmetic in SQL (CAST would silently
 * lose precision). Instead we compare-and-swap: read the raw stored strings,
 * compute the new values as BigInt, then UPDATE only if the stored values are
 * still exactly what we read. A concurrent write changes them, the UPDATE
 * matches zero rows, and we retry with fresh values.
 *
 * Returns false if any field would go negative (funds are left untouched).
 */
export const adjustFunds = async (
    userId: string,
    deltas: Partial<Record<CurrencyField, bigint>>
): Promise<boolean> => {
    const touched = CURRENCY_FIELDS.filter((f) => deltas[f] !== undefined && deltas[f] !== 0n);
    if (touched.length === 0) return true;

    for (let attempt = 0; attempt < CAS_MAX_ATTEMPTS; attempt++) {
        const result = await db.execute({
            sql: 'SELECT balance, vault, credits FROM users WHERE id = ?',
            args: [userId]
        });

        const row = result.rows[0] as any;
        if (!row) {
            // getUser seeds the row with defaults; retry against it.
            await getUser(userId);
            continue;
        }

        const nextValues: string[] = [];
        for (const field of touched) {
            const next = safeBigInt(row[field]) + deltas[field]!;
            if (next < 0n) return false;
            nextValues.push(next.toString());
        }

        const setClause = touched.map((f) => `${f} = ?`).join(', ');
        const guardClause = touched.map((f) => `${f} IS ?`).join(' AND ');
        const guardValues = touched.map((f) => row[f]);

        const update = await db.execute({
            sql: `UPDATE users SET ${setClause} WHERE id = ? AND ${guardClause}`,
            args: [...nextValues, userId, ...guardValues]
        });

        if (update.rowsAffected > 0) return true;
        // Lost the race — another write landed first. Back off, re-read, retry.
        await casBackoff(attempt);
    }

    throw new Error(`adjustFunds: too much contention on user ${userId}, gave up after ${CAS_MAX_ATTEMPTS} attempts`);
};

export const addBalance = async (userId: string, amount: bigint | number) => {
    await adjustFunds(userId, { balance: BigInt(amount) });
};

export const removeBalance = async (userId: string, amount: bigint | number): Promise<boolean> => {
    return adjustFunds(userId, { balance: -BigInt(amount) });
};
