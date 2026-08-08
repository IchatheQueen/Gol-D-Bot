import db from './db';
import { addInventoryItem, getInventoryItem, adjustInventoryItem } from './inventory';
import { GameEvent, EventShopItem, getActiveEvent } from '../data/events';

/**
 * Event currency lives in the normal inventory under the event's currency id,
 * so it survives between occurrences and shows up alongside everything else a
 * player owns. Cosmetics earned from events get their own table since they are
 * one-per-account rather than counted.
 */

export async function ownsCosmetic(userId: string, cosmeticId: string): Promise<boolean> {
    const result = await db.execute({
        sql: 'SELECT 1 FROM user_cosmetics WHERE user_id = ? AND cosmetic_id = ?',
        args: [userId, cosmeticId]
    });
    return result.rows.length > 0;
}

export async function grantCosmetic(userId: string, cosmeticId: string, type: string, source: string): Promise<void> {
    await db.execute({
        sql: `INSERT INTO user_cosmetics (user_id, cosmetic_id, type, source, obtained_at)
              VALUES (?, ?, ?, ?, ?) ON CONFLICT(user_id, cosmetic_id) DO NOTHING`,
        args: [userId, cosmeticId, type, source, Date.now()]
    });
}

export async function getCosmetics(userId: string): Promise<{ cosmetic_id: string; type: string; source: string }[]> {
    const result = await db.execute({
        sql: 'SELECT cosmetic_id, type, source FROM user_cosmetics WHERE user_id = ? ORDER BY obtained_at ASC',
        args: [userId]
    });
    return result.rows as unknown as { cosmetic_id: string; type: string; source: string }[];
}

export async function getEventCurrency(userId: string, event: GameEvent): Promise<bigint> {
    return getInventoryItem(userId, event.currency);
}

/** Ensures a settings row exists so equip writes have something to update. */
async function ensureSettingsRow(userId: string): Promise<void> {
    await db.execute({
        sql: 'INSERT INTO user_settings (user_id) VALUES (?) ON CONFLICT(user_id) DO NOTHING',
        args: [userId]
    });
}

export async function getEquipped(userId: string): Promise<{ badge: string | null; title: string | null }> {
    const result = await db.execute({
        sql: 'SELECT equipped_badge, equipped_title FROM user_settings WHERE user_id = ?',
        args: [userId]
    });
    const row = result.rows[0] as any;
    return {
        badge: row?.equipped_badge ?? null,
        title: row?.equipped_title ?? null,
    };
}

/**
 * Equips an owned cosmetic. Ownership is re-checked here rather than trusted
 * from the caller, so a stale interaction cannot equip something sold or never
 * held.
 */
export async function equipCosmetic(userId: string, cosmeticId: string, type: 'badge' | 'title'): Promise<boolean> {
    if (!(await ownsCosmetic(userId, cosmeticId))) return false;

    await ensureSettingsRow(userId);
    const column = type === 'badge' ? 'equipped_badge' : 'equipped_title';
    await db.execute({
        sql: `UPDATE user_settings SET ${column} = ? WHERE user_id = ?`,
        args: [cosmeticId, userId]
    });
    return true;
}

export async function unequipCosmetic(userId: string, type: 'badge' | 'title'): Promise<void> {
    await ensureSettingsRow(userId);
    const column = type === 'badge' ? 'equipped_badge' : 'equipped_title';
    await db.execute({
        sql: `UPDATE user_settings SET ${column} = NULL WHERE user_id = ?`,
        args: [userId]
    });
}

/** Minimum gap between currency discoveries, so activity spam can't farm it. */
const DISCOVERY_COOLDOWN_MS = 5 * 60 * 1000;
const DISCOVERY_CHANCE = 0.07;

/**
 * Rolls for event currency off the back of an activity.
 *
 * No-ops entirely when no event is running, so callers can fire this from any
 * activity without checking the calendar themselves. Returns the event and the
 * amount found, or null when nothing dropped.
 */
export async function rollEventCurrency(userId: string): Promise<{ event: GameEvent; amount: number } | null> {
    const event = getActiveEvent();
    if (!event) return null;

    const key = `event_currency_${event.id}`;
    const last = await db.execute({
        sql: 'SELECT timestamp FROM cooldowns WHERE user_id = ? AND command = ?',
        args: [userId, key]
    });
    const row = last.rows[0] as any;
    if (row && Date.now() - Number(row.timestamp) < DISCOVERY_COOLDOWN_MS) return null;

    if (Math.random() >= DISCOVERY_CHANCE) return null;

    const amount = 1 + Math.floor(Math.random() * 3);
    await addInventoryItem(userId, event.currency, BigInt(amount));
    await db.execute({
        sql: 'INSERT OR REPLACE INTO cooldowns (user_id, command, timestamp) VALUES (?, ?, ?)',
        args: [userId, key, Date.now()]
    });

    return { event, amount };
}

export type PurchaseResult =
    | { ok: true; item: EventShopItem; amount: number }
    | { ok: false; reason: string };

/**
 * Buys from the event shop.
 *
 * Currency is debited through `adjustInventoryItem` so two concurrent buys
 * cannot spend the same souls, and cosmetics are refused up front rather than
 * charged twice for something already owned.
 */
export async function purchaseEventItem(
    userId: string,
    event: GameEvent,
    item: EventShopItem,
    amount: number
): Promise<PurchaseResult> {
    if (!item.stackable && amount > 1) {
        return { ok: false, reason: `You can only own one ${item.name}.` };
    }

    if (!item.stackable && await ownsCosmetic(userId, item.grants)) {
        return { ok: false, reason: `You already own **${item.name}**.` };
    }

    const total = BigInt(item.cost) * BigInt(amount);
    const spent = await adjustInventoryItem(userId, event.currency, -total);

    if (!spent) {
        const held = await getEventCurrency(userId, event);
        return {
            ok: false,
            reason: `You need ${event.currencyEmoji} ${total} ${event.currencyName} but only have ${event.currencyEmoji} ${held}.`,
        };
    }

    if (item.type === 'item') {
        await addInventoryItem(userId, item.grants, BigInt(amount));
    } else {
        await grantCosmetic(userId, item.grants, item.type, event.id);
    }

    return { ok: true, item, amount };
}
