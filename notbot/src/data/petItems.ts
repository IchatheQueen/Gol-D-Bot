export interface ShopItem {
    id: string;
    name: string;
    price: number;
    currency: 'cash' | 'pills';
    description: string;
    effect?: (user: any, pet: any) => string;
}

export const shopItems: Record<string, ShopItem> = {
    '101': { id: '101', name: 'Water', price: 500, currency: 'cash', description: 'Provides 💧 5 points' },
    '102': { id: '102', name: 'Beer', price: 10000, currency: 'cash', description: 'Provides 💧 20, but halves intellect and agility for 2 hours' },
    '103': { id: '103', name: 'Energy Drink', price: 500, currency: 'cash', description: 'Removes 💧 65, but refills energy completely' },
    '104': { id: '104', name: 'Coffee', price: 120, currency: 'cash', description: 'Provides 💧 8, and adds 🔋 20' },
    '105': { id: '105', name: 'Medicine', price: 3, currency: 'pills', description: 'Provides 💖 250' },
    '106': { id: '106', name: 'Salad', price: 50, currency: 'pills', description: 'Provides 🌯 85 and 💧 85' },
    '107': { id: '107', name: 'Opioid', price: 100, currency: 'cash', description: 'Provides 50 Health but reduces Agility' },
    '108': { id: '108', name: 'Steroid', price: 500, currency: 'cash', description: 'Provides +1 Strength but reduces Health' },
    '201': { id: '201', name: 'Pill Generator', price: 9000, currency: 'cash', description: 'Generates cat pills' },
    '202': { id: '202', name: 'Laser', price: 10000, currency: 'pills', description: 'Instantly vaporizes items, but has a high pill cost' },
    '203': { id: '203', name: 'Pickaxe [T1]', price: 2000, currency: 'pills', description: 'Allows the usage of ~mine' },
};
