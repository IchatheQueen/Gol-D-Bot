export interface CatSkin {
    id: number;
    name: string;
    emoji: string; // The icon shown in the list
    image: string; // The image shown in ~cat
    rarity: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic';
}

export const CAT_SKINS: CatSkin[] = [
    {
        id: 0,
        name: 'Cat',
        emoji: '🐱',
        image: 'https://media.discordapp.net/attachments/1090332800366112831/1090635441776300082/image.png', // Default cat image
        rarity: 'Common'
    },
    {
        id: 1,
        name: 'Kitten',
        emoji: '🐈',
        image: 'https://media.tenor.com/_4u8M0S4QOIAAAAC/cat-kitten.gif',
        rarity: 'Common'
    },
    {
        id: 2,
        name: 'Warrior Cat',
        emoji: '⚔️',
        image: 'https://media.tenor.com/2z8X1_s_K9EAAAAC/cat-sword.gif',
        rarity: 'Rare'
    },
    {
        id: 69,
        // Font: Mathematical Bold Script
        name: '𝓖𝓸𝓸𝓷𝓮𝓻',
        emoji: '🥵',
        image: 'https://media.tenor.com/N6x-2X_C99MAAAAC/cat-stare.gif',
        rarity: 'Legendary'
    }
];

export function getSkin(id: number): CatSkin | undefined {
    return CAT_SKINS.find(s => s.id === id);
}
