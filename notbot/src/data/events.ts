/**
 * Seasonal events and their themed shops.
 *
 * Events recur every year on the same window rather than being one-off dated
 * runs, which is what makes their currencies worth banking: leftovers carry
 * over to the next occurrence instead of being wiped.
 */

export type EventRewardType = 'badge' | 'title' | 'cosmetic' | 'item';

export interface EventShopItem {
    /** Shop id, unique within the event. Bought via `~event buy <id>`. */
    id: string;
    name: string;
    emoji: string;
    /** Cost in the event's currency. */
    cost: number;
    type: EventRewardType;
    description: string;
    /**
     * For `item` rewards, the inventory item id granted. For everything else
     * the cosmetic key recorded against the user.
     */
    grants: string;
    /** Repeatable purchases (consumables); cosmetics are one-per-account. */
    stackable?: boolean;
}

export interface GameEvent {
    id: string;
    name: string;
    emoji: string;
    /** Inventory item id the currency is stored under. */
    currency: string;
    currencyName: string;
    currencyEmoji: string;
    /** Inclusive start/end as [month (1-12), day]. May wrap across new year. */
    start: [number, number];
    end: [number, number];
    blurb: string;
    /** Free-text perks shown on `~event`, e.g. experience buffs. */
    perks: string[];
    shop: EventShopItem[];
}

export const events: GameEvent[] = [
    {
        id: 'lost_souls',
        name: 'Festival of the Lost Souls',
        emoji: '💀',
        currency: 'soul',
        currencyName: 'Souls',
        currencyEmoji: '👻',
        start: [10, 1],
        end: [11, 15],
        blurb: 'Collect lost souls by doing various GoldBot activities, then spend them in the themed shop.',
        perks: [
            'Spooky souls drop at a **7%** chance from activities',
        ],
        shop: [
            {
                id: '1', name: 'Candycorn', emoji: '🍬', cost: 2, type: 'item', grants: 'candycorn', stackable: true,
                description: 'Grants the **Trick or Treat** effect for 30 minutes: +60 energy immediately and a 10% chance to not consume energy when using your cat.',
            },
            {
                id: '2', name: 'Cat Pills', emoji: '💊', cost: 5, type: 'item', grants: 'pill', stackable: true,
                description: 'Got excess souls? Buy some pills.',
            },
            {
                id: '3', name: 'Reaper of Souls', emoji: '🏆', cost: 140, type: 'badge', grants: 'badge_reaper_of_souls',
                description: 'Profile badge. The edition swaps each year.',
            },
            {
                id: '4', name: 'Soul Harvester', emoji: '📜', cost: 225, type: 'title', grants: 'title_soul_harvester',
                description: 'Profile title.',
            },
            {
                id: '5', name: 'Nightmare', emoji: '📜', cost: 175, type: 'title', grants: 'title_nightmare',
                description: 'Profile title.',
            },
            {
                id: '6', name: 'Deathbringer', emoji: '📜', cost: 200, type: 'title', grants: 'title_deathbringer',
                description: 'Profile title.',
            },
        ],
    },
    {
        id: 'holiday_madness',
        name: 'Holiday Madness',
        emoji: '🎄',
        currency: 'gift',
        currencyName: 'Gifts',
        currencyEmoji: '🎁',
        start: [12, 1],
        end: [1, 15],
        blurb: 'Collect gifts by doing various GoldBot activities, then spend them in the themed shop.',
        perks: [
            'Cat Experience is boosted by **+20%** for the duration',
            'Equipping the support server tag grants an extra **+5%** Cat Experience',
        ],
        shop: [
            {
                id: '1', name: 'Candycane', emoji: '🍬', cost: 2, type: 'item', grants: 'candycane', stackable: true,
                description: 'Grants the **Sugar Rush** effect for 30 minutes: restores health and energy based on your generator, and +5% Cat Experience.',
            },
            {
                id: '2', name: 'Cat Pills', emoji: '💊', cost: 5, type: 'item', grants: 'pill', stackable: true,
                description: 'Got excess gifts? Buy some pills.',
            },
            {
                id: '3', name: "Santa's Little Thief", emoji: '🏆', cost: 140, type: 'badge', grants: 'badge_santas_little_thief',
                description: 'Profile badge. The edition swaps each year.',
            },
            {
                id: '4', name: 'Frost Knight', emoji: '📜', cost: 150, type: 'title', grants: 'title_frost_knight',
                description: 'Profile title.',
            },
            {
                id: '5', name: 'Frostbite', emoji: '📜', cost: 175, type: 'title', grants: 'title_frostbite',
                description: 'Profile title.',
            },
            {
                id: '6', name: 'Snow Blaster', emoji: '🔊', cost: 300, type: 'cosmetic', grants: 'cosmetic_snow_blaster',
                description: 'Speaker cosmetic.',
            },
        ],
    },
];

/** Day-of-year style ordinal used only for range comparison. */
function ord(month: number, day: number): number {
    return month * 100 + day;
}

/**
 * Whether a date falls inside an event window, handling windows that wrap the
 * new year (Holiday Madness runs Dec 1 -> Jan 15).
 */
export function isEventActive(event: GameEvent, at: Date = new Date()): boolean {
    const now = ord(at.getMonth() + 1, at.getDate());
    const from = ord(event.start[0], event.start[1]);
    const to = ord(event.end[0], event.end[1]);

    return from <= to ? now >= from && now <= to : now >= from || now <= to;
}

export function getActiveEvent(at: Date = new Date()): GameEvent | null {
    return events.find(e => isEventActive(e, at)) || null;
}

export function getEvent(id: string): GameEvent | undefined {
    return events.find(e => e.id === id);
}
