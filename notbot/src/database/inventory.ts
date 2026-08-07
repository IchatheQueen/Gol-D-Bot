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

import { casBackoff } from './economy';

const CAS_MAX_ATTEMPTS = 12;

/**
 * Applies a signed delta to a stack atomically via compare-and-swap.
 *
 * Amounts are TEXT (they can exceed 64-bit), so the arithmetic happens in
 * BigInt and the write is guarded on the value we read. If a concurrent
 * command changed the stack, the guard matches nothing and we retry.
 *
 * Returns false if the stack would go negative (nothing is written).
 */
export async function adjustInventoryItem(userId: string, itemId: string, delta: bigint): Promise<boolean> {
    if (delta === 0n) return true;

    for (let attempt = 0; attempt < CAS_MAX_ATTEMPTS; attempt++) {
        const result = await db.execute({
            sql: 'SELECT amount FROM inventory WHERE user_id = ? AND item_id = ?',
            args: [userId, itemId]
        });

        const row = result.rows[0] as unknown as { amount: string } | undefined;
        const current = row ? BigInt(row.amount) : 0n;
        const next = current + delta;

        if (next < 0n) return false;

        if (!row) {
            // No stack yet — insert, but lose gracefully if someone beat us to it.
            const insert = await db.execute({
                sql: 'INSERT INTO inventory (user_id, item_id, amount) VALUES (?, ?, ?) ON CONFLICT(user_id, item_id) DO NOTHING',
                args: [userId, itemId, next.toString()]
            });
            if (insert.rowsAffected > 0) return true;
            await casBackoff(attempt);
            continue;
        }

        const write = next === 0n
            ? await db.execute({
                sql: 'DELETE FROM inventory WHERE user_id = ? AND item_id = ? AND amount IS ?',
                args: [userId, itemId, row.amount]
            })
            : await db.execute({
                sql: 'UPDATE inventory SET amount = ? WHERE user_id = ? AND item_id = ? AND amount IS ?',
                args: [next.toString(), userId, itemId, row.amount]
            });

        if (write.rowsAffected > 0) return true;
        // Lost the race — back off, re-read and try again.
        await casBackoff(attempt);
    }

    throw new Error(`adjustInventoryItem: too much contention on ${userId}/${itemId}, gave up after ${CAS_MAX_ATTEMPTS} attempts`);
}

export async function addInventoryItem(userId: string, itemId: string, amount: bigint): Promise<void> {
    await adjustInventoryItem(userId, itemId, amount);
}

export async function removeInventoryItem(userId: string, itemId: string, amount: bigint): Promise<boolean> {
    return adjustInventoryItem(userId, itemId, -amount);
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
