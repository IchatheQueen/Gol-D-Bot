import db from './db';

export interface InventoryItem {
    user_id: string;
    item_id: string;
    amount: string; // Stored as TEXT in DB
}

export async function getInventoryItem(userId: string, itemId: string): Promise<bigint> {
    const result = await db.execute({
        sql: 'SELECT amount FROM inventory WHERE user_id = ? AND item_id = ?',
        args: [userId, itemId]
    });
    const row = result.rows[0] as unknown as { amount: string } | undefined;
    return row ? BigInt(row.amount) : 0n;
}

export async function updateInventoryItem(userId: string, itemId: string, amount: bigint): Promise<void> {
    if (amount <= 0n) {
        // Remove item if amount is 0 or less
        await db.execute({
            sql: 'DELETE FROM inventory WHERE user_id = ? AND item_id = ?',
            args: [userId, itemId]
        });
    } else {
        await db.execute({
            sql: 'INSERT INTO inventory (user_id, item_id, amount) VALUES (?, ?, ?) ON CONFLICT(user_id, item_id) DO UPDATE SET amount = ?',
            args: [userId, itemId, amount.toString(), amount.toString()]
        });
    }
}

export async function addInventoryItem(userId: string, itemId: string, amount: bigint): Promise<void> {
    const current = await getInventoryItem(userId, itemId);
    await updateInventoryItem(userId, itemId, current + amount);
}

export async function removeInventoryItem(userId: string, itemId: string, amount: bigint): Promise<boolean> {
    const current = await getInventoryItem(userId, itemId);
    if (current < amount) return false;
    await updateInventoryItem(userId, itemId, current - amount);
    return true;
}

export async function getInventory(userId: string): Promise<{ item_id: string; amount: bigint }[]> {
    const result = await db.execute({
        sql: 'SELECT item_id, amount FROM inventory WHERE user_id = ?',
        args: [userId]
    });
    return (result.rows as unknown as { item_id: string; amount: string }[]).map(row => ({
        item_id: row.item_id,
        amount: BigInt(row.amount)
    }));
}
