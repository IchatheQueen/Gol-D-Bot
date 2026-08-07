import { Message, Client, EmbedBuilder } from 'discord.js';
import { Command } from '../../handlers/commandHandler';
import { getInventoryItem, adjustInventoryItem, addInventoryItem } from '../../database/inventory';
import { getUserColor } from '../../database/userColor';
import { formatBigNumber, parseBigNumber } from '../../utils/bigNumbers';
import { plants } from './harvest';
import { items } from '../../data/items';

// ~farm advertises: "destroy a crop and receive two harvests worth of
// drugs/materials". The plant itself is consumed.
const HARVESTS_REFUNDED = 2n;

const CROP_ALIASES: Record<string, string> = {
    cannabis: '102',
    weed: '102',
    can: '102',
    opium: '103',
    poppy: '103',
    opi: '103',
    cotton: '104',
    cot: '104',
    linen: '105',
    lin: '105',
};

const command: Command = {
    name: 'destroy',
    description: 'Destroy a crop and receive two harvests worth of its yield',
    usage: '~destroy <type> <amount>',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;
        const typeArg = args[0]?.toLowerCase();

        if (!typeArg) {
            message.reply('You must specify a crop for this command to work!');
            return;
        }

        const cropId = CROP_ALIASES[typeArg] ?? (plants[typeArg] ? typeArg : undefined);

        if (!cropId) {
            message.reply(`Invalid crop! Available: ${Object.keys(CROP_ALIASES).join(', ')}`);
            return;
        }

        const plant = plants[cropId];
        const owned = await getInventoryItem(userId, cropId);

        if (owned < 1n) {
            message.reply(`You don't have any **${items[cropId]?.name || cropId}** planted!`);
            return;
        }

        // No amount given destroys a single plant, matching `~destroy <type> <amount>`
        // where amount is optional.
        let amount = args[1] ? (parseBigNumber(args[1]) ?? 0n) : 1n;
        if (args[1]?.toLowerCase() === 'all') amount = owned;

        if (amount <= 0n) {
            message.reply('Please specify a valid amount.');
            return;
        }

        if (amount > owned) {
            message.reply(`You only have **${formatBigNumber(owned)}** of that crop!`);
            return;
        }

        const removed = await adjustInventoryItem(userId, cropId, -amount);
        if (!removed) {
            message.reply(`You only have **${formatBigNumber(owned)}** of that crop!`);
            return;
        }

        const yieldAmount = amount * BigInt(plant.harvestAmount) * HARVESTS_REFUNDED;
        await addInventoryItem(userId, plant.harvestItem, yieldAmount);

        const cropDef = items[cropId];
        const yieldDef = items[plant.harvestItem];

        const embed = new EmbedBuilder()
            .setDescription(
                `${message.author.username} (@${message.author.username}) destroyed ` +
                `${cropDef?.emoji || '🌱'} ${formatBigNumber(amount)} and salvaged ` +
                `${yieldDef?.emoji || '📦'} ${formatBigNumber(yieldAmount)}`
            )
            .setColor(getUserColor(userId));

        message.reply({ embeds: [embed] });
    },
};

export default command;
