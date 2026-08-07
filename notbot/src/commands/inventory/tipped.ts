import { Message, Client, EmbedBuilder } from 'discord.js';
import { getInventory } from '../../database/inventory';
import { getUser, updateUser } from '../../database/economy';
import { Command } from '../../handlers/commandHandler';
import { getUserColor } from '../../database/userColor';
import { userTag } from '../../utils/userTag';

/**
 * Canonical tipped-arrow definitions. Item IDs use the `tipped_` scheme —
 * previously the listing read `tipped_*`, the selector wrote `arrow_*`, and
 * briefcases granted a generic `tipped_arrow`, so nothing lined up.
 */
export const TIPPED_ARROWS = [
    { id: 'tipped_normal', name: 'Normal', emoji: '🏹', effect: 'Normal tipped arrows have no special effects!' },
    { id: 'tipped_nitro', name: 'Nitro', emoji: '🏹', effect: 'Chance to stun the target and bypass cat protections.', perk: '◉ Support Server Booster Perk' },
    { id: 'tipped_armorshred', name: 'Armorshred', emoji: '🏹', effect: "Deals damage to your opponent's cat when they are on protect" },
    { id: 'tipped_slime', name: 'Slime', emoji: '🏹', effect: 'Chance to stun your opponent' },
    { id: 'tipped_slowness', name: 'Slowness', emoji: '🏹', effect: 'Applies a stack of ☠️ Chained and 10% to apply another' },
] as const;

// Accepted spellings when equipping, e.g. `~tipped armor`.
const ALIASES: Record<string, string> = {
    normal: 'tipped_normal',
    nitro: 'tipped_nitro',
    armorshred: 'tipped_armorshred',
    armor: 'tipped_armorshred',
    shred: 'tipped_armorshred',
    slime: 'tipped_slime',
    slow: 'tipped_slowness',
    slowness: 'tipped_slowness',
};

const command: Command = {
    name: 'tipped',
    description: 'Check or equip your tipped arrows',
    usage: '~tipped [type]',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;
        const requested = args[0]?.toLowerCase();

        // With an argument this equips; with none it lists. Matches the
        // in-embed instruction "Equip a tipped arrow type with ~tipped <type>".
        if (requested) {
            const arrowId = ALIASES[requested];

            if (!arrowId) {
                message.reply(`Invalid arrow type! Available: ${Object.keys(ALIASES).join(', ')}`);
                return;
            }

            const arrow = TIPPED_ARROWS.find(a => a.id === arrowId)!;
            const inventory = await getInventory(userId);
            const owned = inventory.find(i => i.item_id === arrowId)?.amount || 0n;

            if (owned < 1n && arrowId !== 'tipped_normal') {
                message.reply(`You don't have any **${arrow.name}** tipped arrows! Obtain them from briefcases via \`~steal\`.`);
                return;
            }

            await updateUser(userId, { selected_arrow: arrowId });

            const embed = new EmbedBuilder()
                .setDescription(`${message.author.username} (${message.author}) has equipped ${arrow.emoji} **${arrow.name}** tipped arrows`)
                .setColor(getUserColor(userId));

            message.reply({ embeds: [embed] });
            return;
        }

        const inventory = await getInventory(userId);
        const user = await getUser(userId);
        const equipped = TIPPED_ARROWS.find(a => a.id === user.selected_arrow) || TIPPED_ARROWS[0];

        const collection = TIPPED_ARROWS.map(arrow => {
            const owned = inventory.find(i => i.item_id === arrow.id)?.amount || 0n;
            const lines = [
                `${arrow.emoji} **${arrow.name}** | ${owned.toLocaleString()}`,
                `└ ${arrow.effect}`,
            ];
            if ('perk' in arrow) lines.push(`└ ${arrow.perk}`);
            return lines.join('\n');
        }).join('\n');

        const embed = new EmbedBuilder()
            .setTitle(`${userTag(message)}'s Tipped Arrows`)
            .setDescription(
                `Obtain tipped variants from different briefcases via \`~steal\`.\n` +
                `Equip a tipped arrow type with \`~tipped <type>\`\n` +
                `**Currently Equipped:** ${equipped.emoji} ${equipped.name}\n\n` +
                `**Tipped Collection**\n` +
                collection
            )
            .setColor(getUserColor(userId));

        message.reply({ embeds: [embed] });
    },
};

export default command;
