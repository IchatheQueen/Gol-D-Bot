/**
 * Profile cosmetics: badges and titles.
 *
 * Ownership lives in `user_cosmetics` (granted by events, achievements or
 * staff); this file is only the catalog of what exists and how it reads. Ids
 * here must match the `grants` values used by the event shop in data/events.ts.
 */

export type CosmeticType = 'badge' | 'title' | 'cosmetic';

export interface Cosmetic {
    id: string;
    name: string;
    emoji: string;
    /** Shown in `/badges info` and the catalog. */
    description: string;
    /** Where it comes from, for the catalog listing. */
    source: string;
    type: CosmeticType;
    /** Hidden from the public catalog (staff/dev only). */
    secret?: boolean;
}

export const cosmetics: Record<string, Cosmetic> = {
    // ── Event badges ────────────────────────────────────────────────────────
    'badge_reaper_of_souls': {
        id: 'badge_reaper_of_souls', name: 'Reaper of Souls', emoji: '💀', type: 'badge',
        description: 'Awarded to those who harvested enough souls during the Festival of the Lost Souls.',
        source: 'Festival of the Lost Souls — event shop',
    },
    'badge_santas_little_thief': {
        id: 'badge_santas_little_thief', name: "Santa's Little Thief", emoji: '🎅', type: 'badge',
        description: 'For those who took rather than gave during Holiday Madness.',
        source: 'Holiday Madness — event shop',
    },

    // ── Event titles ────────────────────────────────────────────────────────
    'title_soul_harvester': {
        id: 'title_soul_harvester', name: 'Soul Harvester', emoji: '👻', type: 'title',
        description: 'A title for the dedicated collector of lost souls.',
        source: 'Festival of the Lost Souls — event shop',
    },
    'title_nightmare': {
        id: 'title_nightmare', name: 'Nightmare', emoji: '🌑', type: 'title',
        description: 'Something to be feared.',
        source: 'Festival of the Lost Souls — event shop',
    },
    'title_deathbringer': {
        id: 'title_deathbringer', name: 'Deathbringer', emoji: '⚰️', type: 'title',
        description: 'Death follows where you walk.',
        source: 'Festival of the Lost Souls — event shop',
    },
    'title_frost_knight': {
        id: 'title_frost_knight', name: 'Frost Knight', emoji: '❄️', type: 'title',
        description: 'Sworn to the winter.',
        source: 'Holiday Madness — event shop',
    },
    'title_frostbite': {
        id: 'title_frostbite', name: 'Frostbite', emoji: '🧊', type: 'title',
        description: 'Exclusive to Holiday Madness.',
        source: 'Holiday Madness — event shop',
    },

    // ── Membership ──────────────────────────────────────────────────────────
    'title_gilded': {
        id: 'title_gilded', name: 'Gilded', emoji: '🟡', type: 'title',
        description: 'Exclusive to GoldBot Gold members.',
        source: 'GoldBot Gold membership',
    },

    // ── Contribution ────────────────────────────────────────────────────────
    'title_bug_hunter_1': {
        id: 'title_bug_hunter_1', name: 'Bug Hunter I', emoji: '🐛', type: 'title',
        description: 'Reported a confirmed bug.',
        source: 'Awarded by staff',
    },
    'title_bug_hunter_2': {
        id: 'title_bug_hunter_2', name: 'Bug Hunter II', emoji: '🐛', type: 'title',
        description: 'Reported several confirmed bugs.',
        source: 'Awarded by staff',
    },
    'title_bug_hunter_3': {
        id: 'title_bug_hunter_3', name: 'Bug Hunter III', emoji: '🐛', type: 'title',
        description: 'A relentless finder of broken things.',
        source: 'Awarded by staff',
    },
    'title_galaxy_brain': {
        id: 'title_galaxy_brain', name: 'Galaxy Brain', emoji: '🧠', type: 'title',
        description: 'For an idea nobody else had.',
        source: 'Awarded by staff',
    },

    // ── Weapon cosmetics ────────────────────────────────────────────────────
    'cosmetic_snow_blaster': {
        id: 'cosmetic_snow_blaster', name: 'Snow Blaster', emoji: '🔊', type: 'cosmetic',
        description: 'A festive reskin for your speaker.',
        source: 'Holiday Madness — event shop',
    },
};

export function getCosmetic(id: string): Cosmetic | undefined {
    return cosmetics[id];
}

export function catalog(type: CosmeticType): Cosmetic[] {
    return Object.values(cosmetics).filter(c => c.type === type && !c.secret);
}

/** Renders an owned-or-not line for catalog and view listings. */
export function cosmeticLine(c: Cosmetic, owned: boolean): string {
    return `${owned ? '✅' : '🔒'} ${c.emoji} **${c.name}**\n└ ${c.description}\n└ *${c.source}*`;
}
