import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder, Client } from 'discord.js';
import { getCosmetics, ownsCosmetic, equipCosmetic, unequipCosmetic, getEquipped } from '../database/events';
import { catalog, getCosmetic, cosmeticLine, CosmeticType } from '../data/cosmetics';
import { getUserColor } from '../database/userColor';

/**
 * `/badges` and `/titles` are the same command with a different noun, so the
 * whole thing is built once and specialised by type. Keeping them as one
 * implementation means the two can't drift apart as cosmetics are added.
 */
export function buildCosmeticCommand(type: 'badge' | 'title') {
    const plural = type === 'badge' ? 'badges' : 'titles';
    const Plural = type === 'badge' ? 'Badges' : 'Titles';

    const data = new SlashCommandBuilder()
        .setName(plural)
        .setDescription(`View, equip and browse ${plural}`)
        .addSubcommand(s => s
            .setName('view')
            .setDescription(`View the ${plural} you or another user has unlocked`)
            .addUserOption(o => o.setName('user').setDescription('Whose to view').setRequired(false)))
        .addSubcommand(s => s
            .setName('equip')
            .setDescription(`Equip a ${type} you own`)
            .addStringOption(o => o.setName('id').setDescription(`The ${type} id (use /${plural} view)`).setRequired(true)))
        .addSubcommand(s => s
            .setName('unequip')
            .setDescription(`Remove your equipped ${type}`))
        .addSubcommand(s => s
            .setName('info')
            .setDescription(`View information about a ${type}`)
            .addStringOption(o => o.setName('id').setDescription(`The ${type} id`).setRequired(true)))
        .addSubcommand(s => s
            .setName('catalog')
            .setDescription(`View every ${type} in GoldBot`));

    const execute = async (interaction: ChatInputCommandInteraction, _client: Client) => {
        const sub = interaction.options.getSubcommand();
        const invoker = interaction.user.id;
        const colour = getUserColor(invoker);

        if (sub === 'view') {
            const target = interaction.options.getUser('user') ?? interaction.user;
            const owned = (await getCosmetics(target.id)).filter(c => c.type === type);
            const equipped = await getEquipped(target.id);
            const equippedId = type === 'badge' ? equipped.badge : equipped.title;

            const embed = new EmbedBuilder()
                .setTitle(`${Plural} — ${target.username}`)
                .setColor(colour);

            if (owned.length === 0) {
                embed.setDescription(`${target.id === invoker ? 'You have' : 'They have'} not unlocked any ${plural} yet.`);
            } else {
                embed.setDescription(owned.map(o => {
                    const def = getCosmetic(o.cosmetic_id);
                    const mark = o.cosmetic_id === equippedId ? ' *(equipped)*' : '';
                    return def
                        ? `${def.emoji} **${def.name}**${mark}\n└ \`${def.id}\``
                        : `• \`${o.cosmetic_id}\`${mark}`;
                }).join('\n'));
            }

            await interaction.reply({ embeds: [embed] });
            return;
        }

        if (sub === 'equip') {
            const id = interaction.options.getString('id', true);
            const def = getCosmetic(id);

            if (!def || def.type !== type) {
                await interaction.reply({ content: `That is not a valid ${type} id.`, ephemeral: true });
                return;
            }

            const ok = await equipCosmetic(invoker, id, type);
            if (!ok) {
                await interaction.reply({ content: `You do not own **${def.name}**.`, ephemeral: true });
                return;
            }

            await interaction.reply({
                embeds: [new EmbedBuilder()
                    .setDescription(`✅ Equipped ${def.emoji} **${def.name}**.`)
                    .setColor(colour)],
            });
            return;
        }

        if (sub === 'unequip') {
            await unequipCosmetic(invoker, type);
            await interaction.reply({
                embeds: [new EmbedBuilder().setDescription(`✅ Removed your equipped ${type}.`).setColor(colour)],
            });
            return;
        }

        if (sub === 'info') {
            const id = interaction.options.getString('id', true);
            const def = getCosmetic(id);

            if (!def || def.type !== type) {
                await interaction.reply({ content: `That is not a valid ${type} id.`, ephemeral: true });
                return;
            }

            await interaction.reply({
                embeds: [new EmbedBuilder()
                    .setTitle(`${def.emoji} ${def.name}`)
                    .setDescription(`${def.description}\n\n**Obtained from**\n${def.source}\n\n\`${def.id}\``)
                    .setColor(colour)],
            });
            return;
        }

        // catalog
        const all = catalog(type as CosmeticType);
        const ownedIds = new Set((await getCosmetics(invoker)).map(c => c.cosmetic_id));

        await interaction.reply({
            embeds: [new EmbedBuilder()
                .setTitle(`📖 ${Plural} Catalog`)
                .setDescription(all.map(c => cosmeticLine(c, ownedIds.has(c.id))).join('\n\n'))
                .setFooter({ text: `${ownedIds.size > 0 ? [...ownedIds].filter(i => getCosmetic(i)?.type === type).length : 0}/${all.length} unlocked` })
                .setColor(colour)],
        });
    };

    return { data, execute };
}
