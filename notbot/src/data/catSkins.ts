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
        image: 'https://cdn.discordapp.com/attachments/1393132872554250291/1447481065580134420/HnwS5sq.gif?ex=6937c74a&is=693675ca&hm=2294ced89e2137fbfe0fb7bb13913431ec2084068b3e85d765efb4ef238b22ba&',
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
        image: 'https://cdn.discordapp.com/attachments/1393132872554250291/1447482916102738035/PXON44J.gif?ex=6937c904&is=69367784&hm=3737a6ed82a96f7a147b4e0823f0b3cb42e86bc8b5d7edabe8dfa724a526982a&'
    }
];

export function getSkin(id: number): CatSkin | undefined {
    return CAT_SKINS.find(s => s.id === id);
}
