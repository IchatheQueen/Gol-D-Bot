export interface BlackMarketItem {
    id: string;
    name: string;
    price: number;
    currency: 'cash' | 'weed' | 'opioid';
    description: string;
    emoji?: string;
    type: 'drug' | 'farming' | 'counterfeit';
}

export const blackMarketItems: Record<string, BlackMarketItem> = {
    '1': { id: '1', name: 'Weed', emoji: '1445946808982569071', price: 20000000000, currency: 'cash', description: 'This shop\'s currency, and are able to ~smoke it!', type: 'drug' },
    '2': { id: '2', name: '12B', price: 1, currency: 'weed', description: 'Sell your weed to someone else', type: 'drug' },
    '3': { id: '3', name: 'Opioid', price: 10000000, emoji: '<:opioid:1447325599554211940>', currency: 'weed', description: 'For information regarding this drug do ~help opioids', type: 'drug' },
    '4': { id: '4', name: 'Steroid', price: 5000000, emoji: '1446143494610485289', currency: 'weed', description: 'Increases strength temporarily', type: 'drug' },
    '5': { id: '5', name: 'Anesthesia', price: 2000000, emoji: '1445946885037887578', currency: 'weed', description: 'Numbs pain', type: 'drug' },
    '6': { id: '6', name: 'LSD', price: 15000000, emoji: '1445946844470579210', currency: 'weed', description: 'Trippy effects', type: 'drug' },

    // Farming
    '102': { id: '102', name: 'Cannabis Plant', price: 20, currency: 'weed', emoji: '🌱', description: 'Yields 3 Weed every 12h', type: 'farming' },
    '103': { id: '103', name: 'Opium Plant', price: 6, currency: 'opioid', emoji: '🌹', description: 'Yields 1 Opioid every 12h', type: 'farming' },
    '104': { id: '104', name: 'Linen Plant', price: 18, currency: 'weed', emoji: '🌾', description: 'Yields 1 Linen every 12h', type: 'farming' },
    '105': { id: '105', name: 'Cotton Plant', price: 67, currency: 'weed', emoji: '🌿', description: 'Yields 1 Cotton every 12h', type: 'farming' },

    // Printer
    '201': { id: '201', name: 'Ink', price: 9000, currency: 'weed', description: 'Printing material', type: 'counterfeit' },
    '204': { id: '204', name: 'Printer', price: 10000000, currency: 'weed', description: 'Your own personal printer', type: 'counterfeit' },
};
