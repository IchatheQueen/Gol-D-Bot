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
        name: 'Gary',
        emoji: '🐌',
        image: 'https://media1.tenor.com/m/7wGqplNf9kMAAAAd/spongebob-gary.gif',
        statEmojis: { thirst: '💧', strength: '🐚', energy: '🐌', health: '❤️' }
    },
    {
        id: 5,
        name: 'Juice WRLD',
        emoji: '🧃',
        image: 'https://media1.tenor.com/m/0zD38X4XjAAAAAAd/juice-wrld-juice-world.gif',
        statEmojis: { strength: '🎤', agility: '🕊️', intellect: '🎵' }
    },
    { id: 6, name: 'Spirit', emoji: '👻', image: 'https://media.tenor.com/m/7wGqplNf9kMAAAAd/spongebob-gary.gif' },
    { id: 7, name: 'Velociraptor', emoji: '🦖', image: 'https://media1.tenor.com/m/8H3f_z7d_z0AAAAd/jurassic-park-raptor.gif' },
    { id: 8, name: '[ Vampire ]', emoji: '🧛', image: 'https://media1.tenor.com/m/1w8D4F_z_z0AAAAd/cat-vampire.gif' },
    { id: 9, name: '[ AHEGAO ]', emoji: '😳', image: 'https://media1.tenor.com/m/2w8D4F_z_z0AAAAd/ahegao-cat.gif' },
    {
        id: 10,
        name: 'Titan',
        emoji: '👹',
        image: 'https://media1.tenor.com/m/NIs2qkhZ-wQAAAAd/berserk-monster.gif',
        statEmojis: { strength: '👺', agility: '🔥', health: '🩸' }
    },
    {
        id: 11,
        name: '𝔇𝔢𝔞𝔱𝔥', // Gothic 'Death'
        emoji: '☠️',
        image: 'https://media1.tenor.com/m/pA_zH9yPhs0AAAAd/berserk-brand-of-sacrifice.gif',
        statEmojis: { strength: '💀', agility: '🧛', intellect: '🌑', health: '⚰️' }
    },
    {
        id: 12,
        name: 'Goose',
        emoji: '🦢',
        image: 'https://media1.tenor.com/m/hnwS5sqAAAAi/goose-knife.gif',
        statEmojis: { strength: '🔪', agility: '🪶', intellect: '😈' }
    },
    {
        id: 69,
        // Font: Mathematical Bold Script
        name: '𝓖𝓸𝓸𝓷𝓮𝓻',
        emoji: '🥵',
        image: 'https://cdn.discordapp.com/attachments/1393132872554250291/1447482916102738035/PXON44J.gif?ex=6937c904&is=69367784&hm=3737a6ed82a96f7a147b4e0823f0b3cb42e86bc8b5d7edabe8dfa724a526982a&',
        statEmojis: {
            hunger: '<a:nods:1447484357391683625>',
            thirst: '<a:TongueLick:1447484028281421905>',
            endurance: '<a:rough_sex_fast:1447484388697706517>',
            strength: '<a:Y_animedead:1447484134070161450>',
            experience: '<a:AnimeGirlSmokingCigarette:1447485181471490088>',
            health: '<a:knife_lick:1447484295684952144>',
            agility: '<:bd_ahegao3:1447484192135843871>',
            intellect: '<a:MemeTrance:1447484072711688232>'
        }
    }
];

export function getSkin(id: number): CatSkin | undefined {
    return CAT_SKINS.find(s => s.id === id);
}
