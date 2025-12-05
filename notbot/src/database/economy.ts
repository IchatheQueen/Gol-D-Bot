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

export const addBalance = async (userId: string, amount: bigint | number) => {
    const user = await getUser(userId);
    await updateUser(userId, { balance: user.balance + BigInt(amount) });
};

export const removeBalance = async (userId: string, amount: bigint | number): Promise<boolean> => {
    const user = await getUser(userId);
    const bigAmount = BigInt(amount);
    if (user.balance < bigAmount) return false;
    await updateUser(userId, { balance: user.balance - bigAmount });
    return true;
};
