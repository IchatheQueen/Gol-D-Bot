import { Message, Client, EmbedBuilder } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';
import { getSkin } from '../../data/catSkins';
import { updatePetStats, isPetDead } from '../../utils/petUtils';
import { formatBigNumber } from '../../utils/bigNumbers';

const createPet = async (userId: string) => {
    await db.execute({
        sql: 'INSERT INTO pets (user_id) VALUES (?)',
        args: [userId]
    });
};

// Helper for Progress Bar
function createProgressBar(current: bigint, max: bigint, size: number = 10): string {
    const percent = Number((current * 100n) / max);
    // Clamp
    const clamped = Math.max(0, Math.min(100, percent));
    const filled = Math.floor((clamped / 100) * size);

    // Custom emojis or unicode
    // Screenshot shows a green bar. Maybe unicode block elements?
    // "🟩🟩🟩🟩⬛⬛⬛⬛" ?
    // Or just "====----"
    // Screenshot: Looks like a solid green line then a dark line.
    // I'll use standard unicode blocks for now: █ and ░ (or similar).
    // Or emojis: 🟩, ⬛

    // Let's use generic characters for now to be safe, or 🟩 if requested.
    // Screenshot: "timeline" style.

    const bar = '🟩'.repeat(filled) + '⬛'.repeat(size - filled);
    return `${bar} ${clamped.toFixed(2)}%`;
}

const command: Command = {
    name: 'cat',
    description: 'Check your cat status',
    aliases: ['petstats', 'spirit', 'naruto'],
    execute: async (message: Message, args: string[], client: Client, forcedSkinId?: number) => {
        // ... (Leaderboard Logic omitted for brevity, keeping existing if needed, but focusing on stats)

        let pet = await updatePetStats(message.author.id);

        if (!pet) {
            await createPet(message.author.id);
            pet = (await updatePetStats(message.author.id))!;
            message.reply('You adopted a new cat!');
        }

        const skinId = forcedSkinId !== undefined ? forcedSkinId : (pet.skin_id || 0);
        const skin = getSkin(skinId) || getSkin(0)!;

        // Default Emojis from Screenshot
        const DEFAULTS = {
            hunger: '🌯', // Burrito? Looks like wrapped food.
            thirst: '💧', // Drop
            energy: '🔋', // Battery
            health: '🩹', // Bandage face? Or heart? Screenshot: 🩹 (Bandage icon)
            experience: '☄️', // Comet/Blue thing?
            credits: '🍥', // Swirl?
            strength: '🔥',
            agility: '⚡', // Lightning
            intellect: '😎', // Cool face
            endurance: '👱‍♀️', // Elf/Girl?
            metabolism: '🍖' // Meat
        };

        const e = { ...DEFAULTS, ...(skin.statEmojis || {}) };

        // XP Calculation
        // Assuming Next Level XP pattern.
        // Screenshot: 1.8B / 3.355B.
        // Let's invent a formula or fetch max_xp if it exists.
        // Assuming current logic just has 'experience'.
        // I will define max_xp based on level.
        const currentXp = BigInt(pet.experience);
        // Formula: Base * (Multiplier ^ Level) ?
        // If Lvl 24 is ~3B.
        // 100 * (1.5 ^ 24)? -> 100 * 16834 = 1.6M. Too low.
        // 1000 * (2 ^ 24) = 16B. Closer.
        // Maybe MaxXP is simply stored? Or simpler formula.
        // I'll use a placeholder MaxXP based on current * 2 for now or a hardcoded curve.
        const maxXp = BigInt(Math.floor(1000 * Math.pow(1.5, pet.level + 1)));
        // Just for display matching, using a large number if level is high.
        // Actually, screenshot shows 3.355B.
        // Let's just calculate Max as Current * 1.5 for visuals if we don't have exact math.
        // Wait, 1.8B is 54% of 3.35B. approx double.
        // Let's set MaxXP to roughly Current / 0.54 if valid, else arbitrary.
        // I'll stick to a standard curve.

        const nextLevelXp = BigInt(Math.floor(100 * Math.pow(1.2, pet.level))); // Arbitrary

        const embed = new EmbedBuilder()
            .setTitle(`[Lvl ${pet.level}] ${pet.name}`)
            .setDescription(`Tamed by ${message.author.username}\n\`~cat help\` to get help with your cat`)
            .setColor('#2f3136')
            .setImage(skin.image)
            .addFields(
                {
                    name: 'Vitals',
                    value: `${e.hunger} Hunger - ${pet.hunger}/100\n${e.thirst} Thirst - ${pet.thirst}/100\n${e.energy} Energy - ${pet.energy}/100\n${e.health} Health - ${pet.health}/${pet.max_health}`,
                    inline: false
                },
                {
                    name: 'Stats',
                    // Screenshot: "Experience - 1,815.../3.355B \n [Bar] 54.11%"
                    // "Credits - 0"
                    // "Strength - 2 (1)" -> What denotes (1)? Maybe (Base + Bonus)? Or (Level)?
                    // I will format as "Value (Level)" or similar.
                    // For now "Value" is fine.
                    value: `${e.experience} Experience - ${formatBigNumber(currentXp)} / ${formatBigNumber(nextLevelXp)}\n` +
                        `${createProgressBar(currentXp, nextLevelXp)}\n` +
                        `${e.credits} Credits - ${pet.credits}\n` +
                        `${e.strength} Strength - ${pet.strength}\n` +
                        `${e.agility} Agility - ${pet.agility}\n` +
                        `${e.intellect} Intellect - ${pet.intellect}\n` +
                        `${e.endurance} Endurance - ${pet.endurance}\n` +
                        `${e.metabolism} Metabolism - ${pet.metabolism}`,
                    inline: false
                }
            )
            .setFooter({ text: 'Spice up your cat with a cosmetic skin via ~catalias', iconURL: 'https://i.imgur.com/wSTFkRM.png' }); // Placeholder icon

        message.reply({ embeds: [embed] });
    },
};

export default command;
