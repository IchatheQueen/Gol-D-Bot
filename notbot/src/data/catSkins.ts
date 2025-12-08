export interface CatSkin {
    id: number;
    name: string;
    emoji: string; // The icon shown in the list
    image: string; // The image shown in ~cat
    statEmojis?: {
        hunger?: string;
        thirst?: string;
        energy?: string;
        health?: string;
        experience?: string;
        credits?: string;
        strength?: string;
        agility?: string;
        intellect?: string;
        endurance?: string;
        metabolism?: string;
    };
}

export const CAT_SKINS: CatSkin[] = [
    {
        id: 0,
        name: 'Cat',
        emoji: '🐱',
        image: 'https://media.discordapp.net/attachments/1090332800366112831/1090635441776300082/image.png' // Default cat image
    },
    {
        id: 1,
        name: 'Kitten',
        emoji: '🐈',
        image: 'https://media1.tenor.com/m/-NyE_jv5iI8AAAAd/cat-cute.gif',
        statEmojis: {
            thirst: '🍼',
            strength: '🐾',
            energy: '💤',
            health: '💖'
        }
    },
    {
        id: 2,
        name: 'Warrior Cat',
        emoji: '⚔️',
        image: 'https://media.tenor.com/2z8X1_s_K9EAAAAC/cat-sword.gif',
        statEmojis: {
            strength: '⚔️',
            endurance: '🛡️',
            energy: '⚡',
            health: '❤️‍🔥',
            metabolism: '🍖'
        }
    },
    {
        id: 69,
        // Font: Mathematical Bold Script
        name: '𝓖𝓸𝓸𝓷𝓮𝓻',
        emoji: '🥵',
        image: 'https://media.tenor.com/N6x-2X_C99MAAAAC/cat-stare.gif'
    }
];

export function getSkin(id: number): CatSkin | undefined {
    return CAT_SKINS.find(s => s.id === id);
}
