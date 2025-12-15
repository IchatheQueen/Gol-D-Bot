import { Message, Client, EmbedBuilder } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';
import { getInventory } from '../../database/inventory';
import { items } from '../../data/items';
import { formatBigNumber } from '../../utils/bigNumbers';
import { resolveTarget } from '../../utils/resolveTarget';

const command: Command = {
    name: 'farm',
    aliases: ['f'],
    description: 'View your farm status',
    execute: async (message: Message, args: string[], client: Client) => {
        const targetId = await resolveTarget(message, args[0]) || message.author.id;
        const targetUser = await client.users.fetch(targetId);

        const inventory = await getInventory(targetId);

        // Crops: 102 (Cannabis), 103 (Opium), 104 (Linen), 105 (Cotton)
        // Barn: fertilizer, cotton, linen, counterfeit
        // Also '2' is Beer? Wait.
        // Screenshot Crops: Cannabis, Opium, Cotton, Linen.
        // Screenshot Barn: Fertilizer, Cotton, Linen, Counterfeit Cash.

        const getAmt = (id: string) => {
            const item = inventory.find(i => i.item_id === id);
            return item ? BigInt(item.amount || 0) : 0n;
        };

        const cropList = [
            { id: '102', label: 'Cannabis', emoji: '🌱' },
            { id: '103', label: 'Opium', emoji: '🌹' }, // Using items.ts emoji if possible, but matching screenshot emoji
            { id: '105', label: 'Cotton', emoji: '🌿' },
            { id: '104', label: 'Linen', emoji: '🌾' }
        ];

        const barnList = [
            { id: 'fertilizer', label: 'Fertilizer', emoji: '💰' },
            { id: 'cotton', label: 'Cotton', emoji: '☁️' },
            { id: 'linen', label: 'Linen', emoji: '📜' },
            { id: 'counterfeit', label: 'Counterfeit Cash', emoji: '💵' }
        ];

        let cropsText = '';
        for (const c of cropList) {
            const amt = getAmt(c.id);
            // items[c.id].emoji might be different, let's trust screenshot or list
            const emoji = items[c.id]?.emoji || c.emoji;
            cropsText += `${emoji} ${c.label} | ${formatBigNumber(amt)}\n`;
        }

        let barnText = '';
        for (const b of barnList) {
            const amt = getAmt(b.id);
            const emoji = items[b.id]?.emoji || b.emoji;
            barnText += `${emoji} ${b.label} | ${formatBigNumber(amt)}\n`;
        }

        const embed = new EmbedBuilder()
            .setTitle(`@${targetUser.username}'s Farm`) // Actually screenshots uses display name logic usually, but username is safe
            .setDescription(
                '`~harvest <type>` to harvest crops\n' +
                '`~destroy <type> <amount>` to destroy a crop and receive two harvests worth of drugs/materials\n' +
                '`~fertilize <type>` to reduce a crop\'s cooldown, requires 💰 1\n\n' +
                '**Crops**\n' +
                cropsText + '\n' +
                '**Barn**\n' +
                barnText
            )
            .setColor('#112211'); // Dark Greenish from screenshot

        message.reply({ embeds: [embed] });
    },
};

export default command;
