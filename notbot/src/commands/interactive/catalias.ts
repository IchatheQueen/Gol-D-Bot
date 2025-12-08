import { Message, Client, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';
import { EmbedUtils } from '../../utils/embeds';
import { CAT_SKINS, getSkin } from '../../data/catSkins';

const command: Command = {
    name: 'catalias',
    description: 'Manage your cat skins',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;

        // 1. Handle "Equip" via argument: ~catalias <id>
        if (args[0] && !isNaN(parseInt(args[0]))) {
            const skinId = parseInt(args[0]);
            const skin = getSkin(skinId);

            if (!skin) {
                message.reply({ embeds: [EmbedUtils.error('Invalid Skin ID.')] });
                return;
            }

            // Check ownership (0 is free)
            if (skinId !== 0) {
                const owned = await db.execute({
                    sql: 'SELECT * FROM user_skins WHERE user_id = ? AND skin_id = ?',
                    args: [userId, skinId]
                });
                if (owned.rows.length === 0) {
                    message.reply({ embeds: [EmbedUtils.error(`You do not own the **${skin.name}** skin.`)] });
                    return;
                }
            }

            // Update pet skin
            await db.execute({
                sql: 'UPDATE pets SET skin_id = ? WHERE user_id = ?',
                args: [skinId, userId]
            });
            // Ensure pet entry exists if not? (~cat ensures it usually, but let's assume user has a cat if they use this)
            // If they don't have a cat, this update does nothing, which is fine.

            message.reply({ embeds: [EmbedUtils.success(`Equipped **${skin.name}** skin!`)] });
            return;
        }

        // 2. Handle "View" / Pagination
        // Fetch all owned skins
        let ownedIds = [0]; // Everyone owns default
        try {
            const result = await db.execute({
                sql: 'SELECT skin_id FROM user_skins WHERE user_id = ?',
                args: [userId]
            });
            const dbIds = result.rows.map((row: any) => row.skin_id as number);
            ownedIds = [...new Set([...ownedIds, ...dbIds])].sort((a, b) => a - b);
        } catch (e) {
            console.error(e);
        }

        // Get currently equipped Skin ID
        let currentSkinId = 0;
        try {
            const petResult = await db.execute({
                sql: 'SELECT skin_id FROM pets WHERE user_id = ?',
                args: [userId]
            });
            if (petResult.rows.length > 0) {
                currentSkinId = (petResult.rows[0] as any).skin_id || 0;
            }
        } catch (e) {
            console.error(e);
        }

        // Pagination State
        const itemsPerPage = 1; // Showing one big card per page as per request style (implied) or list?
        // User requested: "shows all skins you can activate... like this [Image]"
        // The image shows a detailed single embed for a user's aliases, with a list.
        // Wait, the image shows:
        // "#0 Cat [Checkmark]"
        // "You do not have any cat aliases..." inside the description?
        // It looks like a list view.
        // "Cosmetic Count: 0"
        // "#0 Cat"
        // I will implement a list view with pagination if the list is long.
        // Let's do 5 items per page.

        const generateEmbed = (pageIndex: number) => {
            const pageSize = 5;
            const start = pageIndex * pageSize;
            const end = start + pageSize;
            const currentItems = ownedIds.slice(start, end);

            const description = currentItems.map(id => {
                const skin = getSkin(id);
                if (!skin) return `Unknown Skin #${id}`;
                const isEquipped = id === currentSkinId ? '✅' : '';
                return `**#${id} ${skin.emoji} ${skin.name}** ${isEquipped}\nRarity: ${skin.rarity}`;
            }).join('\n\n');

            return EmbedUtils.basic(
                `**Cosmetic Count:** ${ownedIds.length - 1} (+ Default)\nUse \`~catalias <id>\` to equip.\n\n${description}`,
                `${message.author.username}'s Cat Aliases`
            ).setFooter({ text: `Page ${pageIndex + 1}/${Math.ceil(ownedIds.length / pageSize)}` });
        };

        const totalPages = Math.ceil(ownedIds.length / 5);
        let currentPage = 0;

        const sentMessage = await message.reply({
            embeds: [generateEmbed(currentPage)],
            components: totalPages > 1 ? [
                new ActionRowBuilder<ButtonBuilder>().addComponents(
                    new ButtonBuilder().setCustomId('prev').setLabel('<').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId('next').setLabel('>').setStyle(ButtonStyle.Secondary)
                )
            ] : []
        });

        if (totalPages > 1) {
            const collector = sentMessage.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60000 });

            collector.on('collect', async i => {
                if (i.user.id !== userId) {
                    await i.reply({ content: 'Not your menu!', ephemeral: true });
                    return;
                }

                if (i.customId === 'prev') {
                    currentPage = currentPage > 0 ? currentPage - 1 : totalPages - 1;
                } else if (i.customId === 'next') {
                    currentPage = currentPage < totalPages - 1 ? currentPage + 1 : 0;
                }

                await i.update({ embeds: [generateEmbed(currentPage)] });
            });
        }
    },
};

export default command;
