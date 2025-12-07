export interface Item {
    id: string;
    name: string;
    emoji?: string;
    price: number | string;
    currency?: 'cash' | 'beer' | 'diamond' | 'weed' | 'opioid' | 'pills';
    description: string;
    type: 'consumable' | 'collectible' | 'weapon' | 'drug' | 'farming' | 'counterfeit';
    effect?: (user: any, pet?: any) => string;
}

export const items: Record<string, Item> = {
    'cat_food': {
        id: 'cat_food',
        name: 'Cat Food',
        price: 50,
        description: 'Reduces cat hunger by 20.',
        type: 'consumable',
    },
    'toy': {
        id: 'toy',
        name: 'Cat Toy',
        price: 100,
        description: 'Increases cat happiness by 15.',
        type: 'consumable',
    },
    'briefcase': {
        id: 'briefcase',
        name: 'Briefcase',
        price: 5000,
        description: 'Contains random loot.',
        type: 'consumable',
    },
    'fish': {
        id: 'fish',
        name: 'Fish',
        price: 50,
        emoji: '🐟',
        description: 'A fresh fish.',
        type: 'consumable',
    },
    // Pub Items
    '1': { id: '1', name: 'Bar Membership', price: 100000, description: 'Buy a membership and treat yourself to some of the best beers in town', type: 'collectible' },
    '2': { id: '2', name: 'Beer', price: 10000, emoji: '🍺', description: 'Order a nice refreshing stein of beer', type: 'consumable' },
    '3': { id: '3', name: 'Sell Beer', price: 9000, description: 'Don\'t like your beer? You can sell it back to us for a 90% refund', type: 'consumable' }, // Special logic needed for selling
    '4': { id: '4', name: 'Ender', price: 6, currency: 'beer', description: 'Kidnap an EnderMomandNate and receive Ender briefcases daily (~collect ender)', type: 'collectible' },
    '5': { id: '5', name: 'Miner\'s Capsule', price: 0.20, currency: 'diamond', description: 'A chance to win big with some useful commands (~vault help)', type: 'consumable' },

    // Drugs (Substances)
    'weed': { id: 'weed', name: 'Weed', price: 200, emoji: '1445946808982569071', description: 'Medical herb', type: 'drug' },
    'anesthetics': { id: 'anesthetics', name: 'Anesthetics', price: 1000, emoji: '1445946885037887578', description: 'Numbing agent', type: 'drug' },
    'lsd': { id: 'lsd', name: 'LSD', price: 1500, emoji: '1445946844470579210', description: 'Hallucinogen', type: 'drug' },

    // Feed Items
    'pill': { id: 'pill', name: 'Pill', price: 0, description: 'A mysterious pill from your generator', type: 'consumable' },
    'energy_drink': { id: 'energy_drink', name: 'Energy Drink', price: 500, description: 'Restores energy', type: 'consumable' },
    'coffee': { id: 'coffee', name: 'Coffee', price: 120, description: 'Wake up!', type: 'consumable' },
    'opioid': { id: 'opioid', name: 'Opioid', price: 100, emoji: '<:opioid:1447325599554211940>', description: 'Quadruples Endurance', type: 'consumable' },
    'steroid': { id: 'steroid', name: 'Steroid', price: 500, emoji: '1446143494610485289', description: 'Quadruples Strength', type: 'consumable' },
    'medicine': { id: 'medicine', name: 'Medicine', price: 3, currency: 'pills', description: 'Heals you', type: 'consumable' },

    // Weapons (Updated Prices/Currency)
    'pistol': { id: 'pistol', name: 'Pistol', price: 0, emoji: '1445995386031308890', description: 'Default weapon', type: 'weapon' },
    '6': { id: '6', name: 'Pistol Bullet', price: 1, emoji: '🚬', currency: 'beer', description: 'Ammunition for pistols (All players have one! ~select pistol)', type: 'consumable' },
    '7': { id: '7', name: 'Crossbow', price: 20000, emoji: '🏹', currency: 'beer', description: 'Select this weapon with ~select crossbow (Starts with 3 Shots!)', type: 'weapon' },
    '8': { id: '8', name: 'Arrow', price: 1500, emoji: '1446143653931384943', currency: 'beer', description: 'Ammunition for crossbows', type: 'consumable' },
    '9': { id: '9', name: 'Rifle', price: '27000000000000', emoji: '1445995242317942874', currency: 'beer', description: 'Select this weapon with ~select rifle', type: 'weapon' },
    '10': { id: '10', name: 'Rifle Bullet', price: '3000000000000', emoji: '🚬', currency: 'beer', description: 'Ammunition for rifles', type: 'consumable' },
    '11': { id: '11', name: 'Speaker', price: '400000000000000', emoji: '📢', currency: 'beer', description: 'Shatters beer and knocks people unconscious (~select speaker)', type: 'weapon' },
    '12': { id: '12', name: 'Flamethrower', price: '100000000000000000000', emoji: '1446143428290416670', currency: 'beer', description: 'Burns others\' crops but knocks you unconscious as well in the process (~select flame)', type: 'weapon' },
    '13': { id: '13', name: 'Propane', price: '1500000000000000000', currency: 'beer', description: 'Ammunition for flamethrowers', type: 'consumable' },
    'laser': { id: 'laser', name: 'Laser', price: 0, emoji: '🕹️', description: 'Pet laser ability.', type: 'weapon' },

    // Farming & Printer Items
    '102': { id: '102', name: 'Cannabis Plant', price: 20, currency: 'weed', emoji: '🌱', description: 'Yields 3 Weed every 12h', type: 'collectible' },
    '103': { id: '103', name: 'Opium Plant', price: 6, currency: 'opioid', emoji: '🌹', description: 'Yields 1 Opioid every 12h', type: 'collectible' },
    '104': { id: '104', name: 'Linen Plant', price: 18, currency: 'weed', emoji: '🌾', description: 'Yields 1 Linen every 12h', type: 'collectible' },
    '105': { id: '105', name: 'Cotton Plant', price: 67, currency: 'weed', emoji: '🌿', description: 'Yields 1 Cotton every 12h', type: 'collectible' },

    'linen': { id: 'linen', name: 'Linen', price: 0, description: 'Printing material', type: 'collectible' },
    'cotton': { id: 'cotton', name: 'Cotton', price: 0, description: 'Printing material', type: 'collectible' },
    'fertilizer': { id: 'fertilizer', name: 'Fertilizer', price: 1000, currency: 'weed', emoji: '💰', description: 'Reduces crop cooldown', type: 'consumable' },
    'ink': { id: 'ink', name: 'Ink', price: 9000, currency: 'weed', description: 'Printing material', type: 'consumable' },
    'printer': { id: 'printer', name: 'Printer', price: 10000000, currency: 'weed', description: 'Prints Counterfeit money', type: 'collectible' },
    'counterfeit': { id: 'counterfeit', name: 'Counterfeit', price: 0, description: 'Fake money', type: 'collectible' },

    // Premium Shop Items
    // Packages
    'p1': { id: 'p1', name: 'Essentials Package', price: 4, currency: 'diamond', description: 'Conjuror + Statistician', type: 'collectible' },
    'p2': { id: 'p2', name: 'OG Package', price: 9, currency: 'diamond', description: 'Conjuror + Investor + Statistician', type: 'collectible' },
    'p3': { id: 'p3', name: 'No-lifer\'s Package', price: 14, currency: 'diamond', description: 'OG Package + Junkie', type: 'collectible' },
    'p4': { id: 'p4', name: 'Gentlemen\'s Package', price: 13, currency: 'diamond', description: 'Junkie + Investor + Seagull', type: 'collectible' },
    'p5': { id: 'p5', name: 'Flexer\'s Package', price: 17, currency: 'diamond', description: 'Everything but addons', type: 'collectible' },

    // Items
    'p6': { id: 'p6', name: 'Statistician', price: 2, currency: 'diamond', description: 'Premium Role', type: 'collectible' },
    'p7': { id: 'p7', name: 'Conjuror', price: 3, currency: 'diamond', description: 'Premium Role', type: 'collectible' },
    'p8': { id: 'p8', name: 'Junkie', price: 6, currency: 'diamond', description: 'Premium Role', type: 'collectible' },
    'p9': { id: 'p9', name: 'Investor', price: 7, currency: 'diamond', description: 'Premium Role', type: 'collectible' },
    'p10': { id: 'p10', name: 'Seagull', price: 7, currency: 'diamond', description: 'Premium Role', type: 'collectible' },


    // Addons
    'p12': { id: 'p12', name: 'Top Donor Role', price: 7, currency: 'diamond', description: 'Exclusive Role', type: 'collectible' },
    'p13': { id: 'p13', name: 'Recruit', price: 15, currency: 'diamond', description: 'Exclusive Role', type: 'collectible' },
};
