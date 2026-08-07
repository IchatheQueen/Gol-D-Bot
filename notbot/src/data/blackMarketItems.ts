export interface BlackMarketItem {
    id: string;
    name: string;
    price: number | string; // Massive numbers as string
    currency: string; // E.g. 'cash', 'weed', 'opioid', 'ink', 'paper'
    description: string;
    emoji: string;
    type: 'drug' | 'farming' | 'counterfeit';
    paymentItems?: { id: string, amount: bigint }[]; // For complex costs
}

export const blackMarketItems: Record<string, BlackMarketItem> = {
    '001': { id: '1', name: 'Weed', emoji: '🌿', price: '20000000000', currency: 'cash', description: 'Our pot is what you get when you combine dankness, quality, and potency', type: 'drug' },
    '002': { id: 'cash_12b', name: '12B', emoji: '💵', price: '1', currency: 'weed', description: 'Sell your weed to someone else', type: 'drug' },
    '003': { id: 'opioid', name: 'Opioid', emoji: '💊', price: '10000000', currency: 'weed', description: 'Immune to ~shoot & ~beatup ; clears all existing cooldowns; reduces all new cooldowns by half while active; lasts for 30 min', type: 'drug' },
    '004': { id: 'weed_10m', name: '10M Weed', emoji: '🌿', price: '1', currency: 'opioid', description: 'Sell opioids to someone else', type: 'drug' },
    '005': { id: 'steroid', name: 'Steroid', emoji: '💉', price: '18000000', currency: 'opioid', description: 'Immune to ~hex & ~boost ; lowers chance of getting scammed; lasts for 30 min', type: 'drug' },
    '006': { id: 'weed_18m', name: '18M Weed', emoji: '🌿', price: '1', currency: 'steroid', description: 'Sell steroids to someone else', type: 'drug' },
    '007': { id: 'anesthetic', name: 'Anesthetic', emoji: '💉', price: '300000000', currency: 'weed', description: 'Puts you to sleep... immune to all attacks', type: 'drug' },
    '008': { id: 'lsd', name: 'LSD', emoji: '🌀', price: '450000000', currency: 'weed', description: 'Lasts for 15 minutes; commands display INCORRECT numbers', type: 'drug' },
    '101': { id: 'fertilizer', name: 'Fertilizer', emoji: '⚱️', price: '28', currency: 'weed', description: 'Decreases harvest cooldown by half', type: 'farming' },
    '102': { id: 'cannabis_plant', name: 'Cannabis Plant', emoji: '🌱', price: '20', currency: 'weed', description: 'Harvested every 6 hours; yields 🌿 2', type: 'farming' },
    '103': { id: 'opium_poppy', name: 'Opium Poppy', emoji: '🌹', price: '6', currency: 'opioid', description: 'Harvested every 20 hours; yields 💊 1', type: 'farming' },
    '104': { id: 'cotton_plant', name: 'Cotton Plant', emoji: '🌿', price: '10000000', currency: 'weed', description: 'Harvested once every 12 hours; yields ☁️ 2', type: 'farming' },
    '105': { id: 'linen_plant', name: 'Linen Plant', emoji: '🪴', price: '6000000', currency: 'weed', description: 'Harvested once every 8 hours; yields 📜 4', type: 'farming' },
    '201': { id: 'cash_trade', name: 'Cash', emoji: '💵', price: '1', currency: 'counterfeit_cash', description: 'Trade your counterfeit currency', type: 'counterfeit' },
    '202': { id: 'counterfeit_cash', name: 'Counterfeit Cash', emoji: '💵', price: '1', currency: 'complex', description: 'Get 20Q cash', type: 'counterfeit', paymentItems: [{ id: 'ink', amount: 3n }, { id: 'paper', amount: 1n }] },
    '203': { id: 'ink', name: 'Ink Cartridge', emoji: '📼', price: '9000', currency: 'weed', description: 'Ink for printing cash', type: 'counterfeit' },
    '204': { id: 'printer', name: 'Printer', emoji: '🖨️', price: '10000000', currency: 'weed', description: 'Your own personal printer', type: 'counterfeit' }
};
