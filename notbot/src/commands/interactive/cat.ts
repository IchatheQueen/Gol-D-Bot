import { Message, Client, EmbedBuilder } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';
import { getSkin } from '../../data/catSkins';
import { updatePetStats, isPetDead, getPetBuffs } from '../../utils/petUtils';
import { formatBigNumber, formatShorthand } from '../../utils/bigNumbers';

const createPet = async (userId: string) => {
    await db.execute({
        sql: 'INSERT INTO pets (user_id) VALUES (?)',
        args: [userId]
    });
};

// Helper for Progress Bar
function createProgressBar(current: bigint, max: bigint, size: number = 10): string {
    const percent = Number(current * 10000n / max) / 100;
    const clamped = Math.max(0, Math.min(100, percent));
    const filled = Math.floor((clamped / 100) * size);
    const empty = size - filled;

    const bar = '🟩'.repeat(filled) + '⬛'.repeat(empty);
    return `${bar} ${clamped.toFixed(2)}%`;
}

const command: Command = {
    name: 'cat',
    description: 'Check your cat status',
    aliases: ['petstats', 'spirit', 'naruto'],
    execute: async (message: Message, args: string[], client: Client, forcedSkinId?: number) => {
        // ... (Leaderboard Logic omitted for brevity, keeping existing if needed, but focusing on stats)

        if (args[0]?.toLowerCase() === 'help') {
            const embed = new EmbedBuilder()
                .setTitle('🐾 | Cat Help Menu')
                .setDescription('Use these commands to interact with your pet!')
                .addFields(
                    { name: 'Basics', value: '`~cat` - View stats\n`~feed` - Restore vitals\n`~drink` - Restore thirst\n`~pet` - Interaction' },
                    { name: 'Training & Combat', value: '`~hunt` - Gain XP and fish\n`~train` - Boost stats\n`~attack` - Attack others\n`~protect` - Guard yourself' },
                    { name: 'Generator', value: '`~gen` - Pill Generator UI\n`~fund` - Invest money\n`~dispense` - Collect pills' }
                )
                .setColor('#2b2d31');
            message.reply({ embeds: [embed] });
            return;
        }

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
            hunger: '🌯',
            thirst: '💧',
            energy: '🔋',
            health: '🧒', // Girl face icon from screenshot
            experience: '☄️',
            credits: '🏵️',
            strength: '🔥',
            agility: '⚡',
            intellect: '😎',
            endurance: '🧝‍♀️', // Elf icon
            metabolism: '🍖'
        };

        const e = { ...DEFAULTS, ...(skin.statEmojis || {}) };

        const currentXp = BigInt(pet.experience);
        const nextLevelXp = BigInt(Math.floor(400 * Math.pow(1.5, pet.level))); // Adjusted to match Lvl 1 -> 400

        const displayName = message.guild?.members.cache.get(message.author.id)?.displayName || message.author.username;

        const embed = new EmbedBuilder()
            .setTitle(`[Lvl ${pet.level}] ${pet.name}`)
            .setDescription(`Tamed by @${message.author.username}\n\`~cat help\` to get help with your cat`)
            .setColor('#2b2d31')
            .addFields(
                {
                    name: 'Vitals',
                    value: `${e.hunger} Hunger - ${pet.hunger}/100\n${e.thirst} Thirst - ${pet.thirst}/100\n${e.energy} Energy - ${pet.energy}/100\n${e.health} Health - ${pet.health}/${pet.max_health}`,
                    inline: false
                },
                {
                    name: 'Stats',
                    value: `${e.experience} Experience - ${formatBigNumber(currentXp)}/${formatShorthand(nextLevelXp)}\n` +
                        `└ ${createProgressBar(currentXp, nextLevelXp, 10)}\n` +
                        `${e.credits} Credits - ${pet.credits}\n` +
                        `${e.strength} Strength - ${pet.boostedStrength || pet.strength} (${pet.strength})\n` +
                        `${e.agility} Agility - ${pet.boostedAgility || pet.agility} (${pet.agility})\n` +
                        `${e.intellect} Intellect - ${pet.boostedIntellect || pet.intellect} (${pet.intellect})\n` +
                        `${e.endurance} Endurance - ${pet.boostedEndurance || pet.endurance} (${pet.endurance})\n` +
                        `${e.metabolism} Metabolism - ${pet.metabolism} (${pet.metabolism})`,
                    inline: false
                }
            )
            .setFooter({ text: 'Spice up your cat with a cosmetic skin via ~market' });

        message.reply({ embeds: [embed] });
    },
};

export default command;
