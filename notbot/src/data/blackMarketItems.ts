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
    '2': { id: '2', name: '12B', price: 1, emoji: '💵', currency: 'weed', description: 'Sell your weed to someone else', type: 'drug' },
    '3': { id: '3', name: 'Opioid', price: 10000000, emoji: '<:opioid:1447325599554211940>', currency: 'weed', description: 'For information regarding this drug do ~help opioids', type: 'drug' },
    // ...
    // Printer
    '201': { id: '201', name: 'Ink', price: 9000, currency: 'weed', emoji: '📼', description: 'Printing material', type: 'counterfeit' },
    '204': { id: '204', name: 'Printer', price: 10000000, currency: 'weed', emoji: '🖨️', description: 'Your own personal printer', type: 'counterfeit' },
};
