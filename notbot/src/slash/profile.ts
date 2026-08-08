import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder, Client } from 'discord.js';
import db from '../database/db';
import { getUser } from '../database/economy';
import { getCosmetics, getEquipped } from '../database/events';
import { getCosmetic } from '../data/cosmetics';
import { getUserColor } from '../database/userColor';
import { formatBigNumber } from '../utils/bigNumbers';
import { getVaultTier } from '../database/vault';

/**
 * Tracked statistics shown on a profile.
 *
 * Only counters the bot already keeps are listed — inventing figures the bot
 * never recorded would make the panel look complete while being wrong. Stats
 * start from when tracking began, not from account creation.
 */
async function collectStats(userId: string): Promise<string[]> {
    const lines: string[] = [];

    const pet = await db.execute({
        sql: 'SELECT name, level, experience FROM pets WHERE user_id = ?',
        args: [userId]
    });
    const p = pet.rows[0] as any;
    if (p) {
        lines.push(`🐱 Cat: **${p.name}** — [Lvl ${Number(p.level) || 1}] • ✨ ${Number(p.experience) || 0} XP`);
    }

    const commandCount = await db.execute({
        sql: 'SELECT COUNT(*) AS n FROM cooldowns WHERE user_id = ?',
        args: [userId]
    });
    const distinct = Number((commandCount.rows[0] as any)?.n ?? 0);
    if (distinct > 0) {
        lines.push(`🎛️ Distinct commands used: **${distinct}**`);
    }

    const cosmeticCount = (await getCosmetics(userId)).length;
    lines.push(`🎖️ Cosmetics unlocked: **${cosmeticCount}**`);

    return lines;
}

export default {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('View your or another player\'s profile')
        .addUserOption(o => o.setName('user').setDescription('Whose profile to view').setRequired(false)),

    execute: async (interaction: ChatInputCommandInteraction, _client: Client) => {
        const target = interaction.options.getUser('user') ?? interaction.user;

        const [user, equipped, tier, stats] = await Promise.all([
            getUser(target.id),
            getEquipped(target.id),
            getVaultTier(target.id),
            collectStats(target.id),
        ]);

        const badge = equipped.badge ? getCosmetic(equipped.badge) : undefined;
        const title = equipped.title ? getCosmetic(equipped.title) : undefined;

        const heading = [
            badge ? badge.emoji : null,
            `**${target.username}**`,
            title ? `— *${title.name}*` : null,
        ].filter(Boolean).join(' ');

        const bioRow = await db.execute({
            sql: 'SELECT bio FROM users WHERE id = ?',
            args: [target.id]
        });
        const bio = (bioRow.rows[0] as any)?.bio;

        const embed = new EmbedBuilder()
            .setTitle(`${target.username}'s Profile`)
            .setThumbnail(target.displayAvatarURL())
            .setDescription(
                `${heading}\n` +
                (bio && bio !== 'No bio set.' ? `*${bio}*\n` : '') +
                `\n**Economy**\n` +
                `└ 💵 Balance: ${formatBigNumber(user.balance)}\n` +
                `└ 🏦 Vault: ${formatBigNumber(user.vault)} [T${tier}]\n` +
                `\n**Statistics**\n` +
                stats.map(s => `└ ${s}`).join('\n') +
                `\n\n*Statistics only cover activity since tracking began.*`
            )
            .setColor(getUserColor(target.id));

        await interaction.reply({ embeds: [embed] });
    },
};
