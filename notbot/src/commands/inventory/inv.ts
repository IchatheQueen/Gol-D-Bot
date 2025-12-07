import { Message, Client, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ComponentType, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getInventory } from '../../database/inventory';
import { Command } from '../../handlers/commandHandler';
import { items } from '../../data/items';
import { resolveTargetOrSelf } from '../../utils/resolveTarget';

// Define categories matching the screenshot + Requested "Ignore cocaine"
const categories = {
    substances: {
        label: 'Substances',
        emoji: '💊',
        items: [
            { id: '2', hint: 'Hint: Buy more in the `.pub`' }, // Beer
            { id: 'weed', hint: 'Hint: Buy more in the `.blackmarket`' },
            { id: 'opioid', hint: 'Hint: Buy more in the `.blackmarket`' },
            { id: 'steroid', hint: 'Hint: Buy more in the `.blackmarket`' },
            // cocaine ignored
            { id: 'anesthetics', hint: 'Hint: Buy more in the `.blackmarket`' },
            { id: 'lsd', hint: 'Hint: Buy more in the `.blackmarket`' },
        ]
    },
    event_currencies: {
        label: 'Event Currencies',
        emoji: '🎁',
        items: [
            { id: '4', hint: 'Hint: Kidnap EnderMomandNate' }, // Ender
            { id: '5', hint: 'Hint: Buy more in the `.dshop`' }, // Miner's Capsule
            // '1'? Bar Membership? Maybe separate
        ]
    },
    weapons: {
        label: 'Weapons',
        emoji: '🔫', // Using pistol emoji for generic weapon cat
        items: [
            { id: '6', hint: 'Hint: Used for Pistol' },
            { id: '7', hint: 'Hint: Select with .select crossbow' },
            { id: '8', hint: 'Hint: Ammo for Crossbow' },
            { id: '9', hint: 'Hint: Select with .select rifle' },
            { id: '10', hint: 'Hint: Ammo for Rifle' },
            { id: '11', hint: 'Hint: Select with .select speaker' },
            { id: '12', hint: 'Hint: Select with .select flame' },
            { id: '13', hint: 'Hint: Fuel for Flamethrower' },
            { id: 'laser', hint: 'Hint: Pew pew' }
        ]
    }
};

const command: Command = {
    name: 'inv',
    description: 'Check your inventory',
    aliases: ['inventory', 'bag'],
    execute: async (message: Message, args: string[], client: Client) => {
        const target = await resolveTargetOrSelf(message, args, client);
        const userId = target.id;
        const inventory = await getInventory(userId);

        // Helper to get amount
        const getAmount = (id: string) => {
            const found = inventory.find(i => i.item_id === id);
            return found ? found.amount : 0n;
        };

        // Render Function
        const renderCategory = (categoryKey: keyof typeof categories) => {
            const cat = categories[categoryKey];
            let description = '';

            for (const itemEntry of cat.items) {
                const itemDef = items[itemEntry.id];
                if (itemDef) {
                    const amount = getAmount(itemEntry.id);
                    const emoji = itemDef.emoji || '📦';
                    description += `${emoji} ${itemDef.name} | ${amount}\n`;
                    description += `👁️ ${itemEntry.hint}\n`;
                }
            }

            // Fallback if empty in that category? Screenshot shows 0s, so we list all even if 0.

            const embed = new EmbedBuilder()
                .setTitle(`${target.username} (@.${target.username})'s Inventory`)
                .setColor('#2f3136')
                .setDescription(description);

            return embed;
        };

        // Initial render: Substances
        const initialEmbed = renderCategory('substances');

        // Dropdown
        const row = new ActionRowBuilder<StringSelectMenuBuilder>()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('inv_category')
                    .setPlaceholder('Select a Page')
                    .addOptions(
                        {
                            label: 'Substances',
                            value: 'substances',
                            emoji: '💊',
                            default: true
                        },
                        {
                            label: 'Event Currencies',
                            value: 'event_currencies',
                            emoji: '🎁'
                        },
                        {
                            label: 'Weapons',
                            value: 'weapons',
                            emoji: '🔫'
                        }
                    )
            );

        const reply = await message.reply({ embeds: [initialEmbed], components: [row] });

        // Collector
        const collector = reply.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 60000 });

        collector.on('collect', async (i) => {
            if (i.user.id !== message.author.id) {
                i.reply({ content: 'This is not your inventory!', ephemeral: true });
                return;
            }

            const selection = i.values[0] as keyof typeof categories;
            const newEmbed = renderCategory(selection);

            // Update dropdown default
            const newRow = new ActionRowBuilder<StringSelectMenuBuilder>()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('inv_category')
                        .setPlaceholder('Select a Page')
                        .addOptions(
                            {
                                label: 'Substances',
                                value: 'substances',
                                emoji: '💊',
                                default: selection === 'substances'
                            },
                            {
                                label: 'Event Currencies',
                                value: 'event_currencies',
                                emoji: '🎁',
                                default: selection === 'event_currencies'
                            },
                            {
                                label: 'Weapons',
                                value: 'weapons',
                                emoji: '🔫',
                                default: selection === 'weapons'
                            }
                        )
                );

            await i.update({ embeds: [newEmbed], components: [newRow] });
        });
    },
};

export default command;
