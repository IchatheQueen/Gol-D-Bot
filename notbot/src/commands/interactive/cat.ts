import { Message, Client, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ComponentType, StringSelectMenuOptionBuilder } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';
import { getSkin } from '../../data/catSkins';
import { updatePetStats } from '../../utils/petUtils';
import { formatBigNumber, formatShorthand } from '../../utils/bigNumbers';
import { resolveLeaderboardNames, rankPrefix } from '../../utils/leaderboard';
import { getUserColor } from '../../database/userColor';

const createProgressBar = (current: bigint, max: bigint, size: number = 10): string => {
    const percent = Number(current * 10000n / max) / 100;
    const clamped = Math.max(0, Math.min(100, percent));
    const filled = Math.floor((clamped / 100) * size);
    const empty = size - filled;

    const bar = '🟩'.repeat(filled) + '⬛'.repeat(empty);
    return `${bar} ${clamped.toFixed(2)}%`;
};

const HELP_PAGES: Record<string, EmbedBuilder> = {
    commands: new EmbedBuilder()
        .setTitle('Cat Help: Commands')
        .setDescription(`
**~petshop**
└ Shop for cat related items
**~feed <type>**
└ Feed your cat and replenish some of its hunger, thirst, health or grant temporary status effects
**~pet**
└ Reduce your pets feeding cooldown by 1/3
**~hunt**
└ Go on a hunting outing. Energy consumption is based on your endurance.
**~protect**
└ Toggle cat protection, which is set to off by default. Attempts to block incoming attacks.
**~attack**
└ Makes your cat attack another player, targeting items or their cat based off victims protection.
**~retreat**
└ Makes your cat retreat from an ongoing attack.
**~target <item>**
└ Select which item (such as beer or weed) you want the cat to target when attacking
**~train <type> <amount>**
└ Improve your cat's stats (costs <amount> credits)
**~decondition <type>**
└ Lower the cat's stat but receive 🍥 1
`)
        .setColor('#2b2d31')
        .setFooter({ text: 'Make a selection', iconURL: undefined }), // Dropdown placeholder

    guide: new EmbedBuilder()
        .setTitle('Cat Help: Basic Guide')
        .setDescription(`
**Basic Necessities**
Every day, your cat's hunger will drop by 1-5 points while its thirst will drop by 5-12. If you can keep both values above 80, then your cat's health and energy will naturally regenerate. However, both will begin to deteoriate as soon as either of those drop below 30. Therefore, it is very important to feed your cat using \`~feed <type>\`.

**Leveling Up**
Your cat gains experience whenever it does something that requires it to use its abilities i.e. hunting or fighting but not eating or drinking. Hunting every day grants a bonus amount of experience for the first 25 hunts.

**Health and Energy**
Health and energy determine how long your cat can last in a fight. As soon its health drops below 200, it will stop helping you and if its health OR its energy reaches 0, the cat will cease to do anything at all other than eat and drink.

**Cat Stats**
💧 **Experience** - Allows your cat to grow up once it reaches a certain value
🍥 **Credits** - These can be spent on improving other stats such as Strength, Agility, etc
🔥 **Strength** - Determines how much damage the cat can deal
⚡ **Agility** - How swiftly the cat can attack and how likely it is block a bullet or even deflect it
😎 **Intellect** - How efficiently a cat gains experience. Also beneficial in hunting.
🛡️ **Endurance** - The higher a cat's endurance, the less energy it spends and the less damage it takes
`)
        .setColor('#2b2d31'),

    status_effects: new EmbedBuilder()
        .setTitle('Cat Help: Status Effects')
        .setDescription(`
Status effects are temporary buffs or debuffs your cat can have while playing the bot. These effects can be good such as doubling your intellect, or bad, such as disabling your ability to enable protect. Effects can be gained by various means, but most commonly by \`~feed\`

**Effects**
☕ **Coffee [1h]** - Doubles Strength & Intellect
🍺 **Beer [2h]** - Halves Intellect & Agility
💊 **Opioid [1h]** - Quintuples Endurance
💊 **Steroid [1h]** - Quintuples Strength
💊 **cat Pill** - Length and effects based on \`~generator\`
💊 **Candycane Pill [30m]** - +10% Atk Damage & +5% Experience
❌ **Cowardice [15m]** - Disables Protect & GrabId
`)
        .setColor('#2b2d31'),

    // Lazy implement others if needed, using Commands as fallback
    passives: new EmbedBuilder().setTitle('Cat Passives').setDescription('Pasives info coming soon...').setColor('#2b2d31'),
    skills: new EmbedBuilder().setTitle('Cat Skills').setDescription('Skills info coming soon...').setColor('#2b2d31'),
};

const runHelp = async (message: Message) => {
    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('cat_help_menu')
        .setPlaceholder('Make a selection')
        .addOptions(
            new StringSelectMenuOptionBuilder().setLabel('Commands').setDescription('List of commands').setValue('commands').setEmoji('📝'),
            new StringSelectMenuOptionBuilder().setLabel('Guide').setDescription('Maintaining your Cat').setValue('guide').setEmoji('📖'),
            new StringSelectMenuOptionBuilder().setLabel('Status Effects').setDescription('Temp Buff/Debuffs').setValue('status_effects').setEmoji('⚗️'),
            new StringSelectMenuOptionBuilder().setLabel('Cat Passives').setDescription('Passive Skills').setValue('passives').setEmoji('🍥'),
            new StringSelectMenuOptionBuilder().setLabel('Cat Skills').setDescription('Requires inputs to activate').setValue('skills').setEmoji('🤸'),
        );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

    // Default to Commands page
    const response = await message.reply({
        embeds: [HELP_PAGES.commands],
        components: [row]
    });

    const collector = response.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 60000 });

    collector.on('collect', async i => {
        if (i.user.id !== message.author.id) {
            await i.reply({ content: 'This menu is not for you!', ephemeral: true });
            return;
        }

        const selection = i.values[0];
        const page = HELP_PAGES[selection];
        if (page) {
            await i.update({ embeds: [page] });
        }
    });
};

/**
 * Top 10 cats by experience. Ties break on level so a cat that reached the
 * same XP at a higher level ranks first.
 */
const runLeaderboard = async (message: Message, client: Client) => {
    const result = await db.execute(
        'SELECT user_id, level, experience FROM pets ORDER BY experience DESC, level DESC LIMIT 10'
    );
    const rows = result.rows as unknown as { user_id: string; level: number; experience: number }[];

    const embed = new EmbedBuilder()
        .setTitle('🐱 Cat Experience Leaderboard')
        .setColor(getUserColor(message.author.id));

    if (rows.length === 0) {
        embed.setDescription('No cats have been adopted yet!');
        await message.reply({ embeds: [embed] });
        return;
    }

    const names = await resolveLeaderboardNames(client, rows.map(r => String(r.user_id)));

    embed.setDescription(rows.map((row, i) =>
        `${rankPrefix(i)} **${names.get(String(row.user_id))}** • [Lvl ${Number(row.level) || 1}] • ✨ ${Number(row.experience) || 0} XP`
    ).join('\n'));

    await message.reply({ embeds: [embed] });
};

const command: Command = {
    name: 'cat',
    description: 'Check your cat status',
    aliases: ['petstats', 'spirit', 'naruto'],
    execute: async (message: Message, args: string[], client: Client, forcedSkinId?: number) => {
        const sub = args[0]?.toLowerCase();

        if (sub === 'help') {
            await runHelp(message);
            return;
        }

        if (sub === 'lb' || sub === 'leaderboard') {
            await runLeaderboard(message, client);
            return;
        }

        let pet = await updatePetStats(message.author.id);

        if (!pet) {
            // Adoption is explicit via ~adopt; commands no longer silently
            // create a cat for you.
            message.reply('You do not have a pet [Lvl 1] Cat; `~adopt` to adopt one!');
            return;
        }

        const skinId = forcedSkinId !== undefined ? forcedSkinId : (pet.skin_id || 0);
        const skin = getSkin(skinId) || getSkin(0)!;

        // Emojis matching screenshot
        const DEFAULTS = {
            hunger: '🌯',
            thirst: '💧',
            energy: '🔋',
            health: '🏩',
            experience: '💧',
            credits: '🍥', // Wait, screenshot uses '🍥' for Credits in Stats list?
            // Image 0: '🍥 Credits - 0'. Yes.
            strength: '🔥',
            agility: '⚡',
            intellect: '😎',
            endurance: '🛡️',
            metabolism: '🍖'
        };

        const e = { ...DEFAULTS, ...(skin.statEmojis || {}) };

        const currentXp = BigInt(pet.experience);
        const nextLevelXp = BigInt(Math.floor(400 * Math.pow(1.5, pet.level)));
        const nextLevelXpShorthand = formatShorthand(nextLevelXp).toLowerCase(); // 13.107m

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
                    value: `${e.experience} Experience - ${formatBigNumber(currentXp)}/${nextLevelXpShorthand}\n` +
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
            .setFooter({ text: 'Spice up your cat with a cosmetic skin via ~market', iconURL: 'https://em-content.zobj.net/source/microsoft-teams/337/shortcake_1f370.png' }); // 🍰 emoji as icon if possible? Or just text.
        // Screenshot has a cake icon in footer. I can't easily put an emoji as iconURL without an image link.
        // But I can put it in the text: "🍰 Spice up..."
        // Wait, screenshot shows the cake icon on the LEFT of the text. That is `iconURL` behavior.
        // I'll leave iconURL undefined if I don't have a reliable URL, or use a placeholder.
        // Actually, the previous footer text was just text.
        // Let's use text: "🍰 Spice up..."

        // Correction: Screenshot Footer has an ICON.
        // It's a slice of cake.
        // I'll try to use a standard Discord emote URL if I can, or just omit for now and use emoji in text.
        // User screenshot: Icon is definitely there.
        // I will update the footer text to include the emoji at the start if I can't use iconURL.
        // `.setFooter({ text: '🍰 Spice up your cat with a cosmetic skin via ~market' })`
        // Should be close enough.
        embed.setFooter({ text: '🍰 Spice up your cat with a cosmetic skin via ~market' });

        message.reply({ embeds: [embed] });
    },
};

export default command;
