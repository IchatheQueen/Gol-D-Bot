import { Message, Client, EmbedBuilder } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';
import { resolveTargetOrSelf } from '../../utils/resolveTarget';
import { resolveEmoji } from '../../utils/resolveEmoji';

// Premium item definitions
const premiumItems: Record<string, { name: string; emoji: string }> = {
    'p1': { name: 'Essentials Package', emoji: '📦' },
    'p2': { name: 'OG Package', emoji: '📦' },
    'p3': { name: "No-lifer's Package", emoji: '📦' },
    'p4': { name: "Gentlemen's Package", emoji: '📦' },
    'p5': { name: "Flexer's Package", emoji: '📦' },
    'p6': { name: 'Statistician', emoji: '📊' },
    'p7': { name: 'Conjuror', emoji: '🪄' },
    'p8': { name: 'Junkie', emoji: '🚬' },
    'p9': { name: 'Investor', emoji: '💰' },
    'p10': { name: 'Seagull', emoji: '🕊️' },
    'p11': { name: 'Support Server Perk', emoji: '<:hint:1449971693085786162>' }, // Support Server Perk
    'p12': { name: 'Top Donor Role', emoji: '👑' },
    'p13': { name: 'Recruit', emoji: '🎖️' },
};

const command: Command = {
    name: 'ditems',
    description: 'Check your donator items',
    execute: async (message: Message, args: string[], client: Client) => {
        const target = await resolveTargetOrSelf(message, args, client);
        const userId = target.id;

        // Get owned premium items
        const result = await db.execute({
            sql: 'SELECT item_id, amount FROM inventory WHERE user_id = ? AND item_id LIKE ?',
            args: [userId, 'p%']
        });
        const ownedItems = result.rows as unknown as { item_id: string; amount: string }[];

        let itemsList = '';
        for (const item of ownedItems) {
            const itemDef = premiumItems[item.item_id];
            const amount = BigInt(item.amount);
            if (itemDef && amount > 0n) {
                const emoji = resolveEmoji(client, itemDef.emoji);
                itemsList += `${emoji} **${itemDef.name}**\n`;
            }
        }

        if (!itemsList) {
            itemsList = 'This user does not own any donator items.';
        }

        const embed = new EmbedBuilder()
            .setTitle(`@${target.username}'s Donor Items`)
            .setDescription(
                `\`~dshop\` to purchase items\n` +
                `\`~dtransfer <user> <name>\` to transfer an item to another account\n\n` +
                `**Donator Items:**\n${itemsList}`
            )
            .setColor('#9932cc');

        message.reply({ embeds: [embed] });
    },
};

export default command;
