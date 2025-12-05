export interface Stock {
    name: string;
    emoji: string;
    price: bigint;
}

export const stockTypes: Record<number, Stock> = {
    1: { name: 'Casino', emoji: '🎰', price: 90n },
};
