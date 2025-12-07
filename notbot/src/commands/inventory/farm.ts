import { Message, Client, EmbedBuilder } from 'discord.js';
import db from '../../database/db';
import { getInventory } from '../../database/inventory';
import { Command } from '../../handlers/commandHandler';
import { items } from '../../data/items';
import { formatBigNumber } from '../../utils/bigNumbers';

// Plant definitions
const plants: Record<string, { harvestItem: string; harvestAmount: number; harvestTime: number; riskFactor: number }> = {
    'cannabis_plant': { harvestItem: '1', harvestAmount: 3, harvestTime: 12 * 60 * 60 * 1000, riskFactor: 0.10 }, // Weed (BM ID 1)
    'opium_plant': { harvestItem: '3', harvestAmount: 1, harvestTime: 12 * 60 * 60 * 1000, riskFactor: 0.20 }, // Opioid (BM ID 3)
    'linen_plant': { harvestItem: 'linen', harvestAmount: 1, harvestTime: 12 * 60 * 60 * 1000, riskFactor: 0.10 },
    'cotton_plant': { harvestItem: 'cotton', harvestAmount: 1, harvestTime: 12 * 60 * 60 * 1000, riskFactor: 0.10 },
};

const command: Command = {
    name: 'farm',
    description: 'View your farm',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;

        // Fetch inventory
        const inventory = await getInventory(userId);

        // Helper to get amount
        const getAmount = (id: string) => {
            const found = inventory.find(i => i.item_id === id);
            return found ? found.amount : 0n;
        };

        const embed = new EmbedBuilder()
            .setTitle(`${message.author.username} (@${message.author.username})'s Farm`)
            .setColor('#2f3136')
            .setDescription(`\`~harvest <type>\` to harvest crops\n\`~destroy <type> <amount>\` to destroy a crop and receive two harvests worth of drugs/materials\n\`~fertilize <type>\` to reduce a crop's cooldown, requires 💰 1\n\n**Crops**`);

        // Crops Section
        let cropsText = '';
        const plantIds = Object.keys(plants);

        for (const plantId of plantIds) {
            const plantDef = plants[plantId];
            const itemDef = items[plantId];

            if (!plantDef || !itemDef) continue;

            const amount = getAmount(plantId);
            const emoji = itemDef.emoji || '🌿';


            // Generate Status Line
            let statusLine = '';

            if (amount > 0n) {
                // Check cooldown for harvest
                const cooldownKey = `harvest_${plantId}`;
                const cooldownCheck = await db.execute({
                    sql: 'SELECT * FROM cooldowns WHERE user_id = ? AND command = ?',
                    args: [userId, cooldownKey]
                });
                const cooldown = cooldownCheck.rows[0] as any;

                let timeStr = 'Ready!';
                if (cooldown) {
                    const timeLeft = Number(cooldown.timestamp) + plantDef.harvestTime - Date.now();
                    if (timeLeft > 0) {
                        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
                        // Matching style "in 2 hours"
                        if (hours === 0) timeStr = 'in less than an hour';
                        else timeStr = `in ${hours} hours`;
                    } else {
                        timeStr = 'now';
                    }
                } else {
                    timeStr = 'now';
                }

                // Show Risk% and Scythe (Time)
                // User said "remove cockroach emoji" -> Just show percentage?
                // Screenshot: [Cockroach] 10% | [Scythe] in 2 hours
                // New: 10% | 镰 in 2 hours
                const risk = plantDef.riskFactor * 100;
                statusLine = `┕ ${risk}% | 镰 ${timeStr}`;
            } else {
                statusLine = `┕  0% | 镰 Not Planted`;
            }

            // Append to crops text
            // Format: Emoji Name | Amount (digits)
            // Use formatBigNumber which handles the commas and digits truncation logic roughly
            // Note: formatBigNumber output: "26,791...&134" or similar depending on implementation.
            // Screen shot showed: "26,791...(134 digits)". My utils does &X.
            // I'll stick to utils for consistency.
            const amtStr = formatBigNumber(amount);

            cropsText += `${emoji} ${itemDef.name} | ${amtStr}\n${statusLine}\n`;
        }

        // Barn Section
        let barnText = '**Barn**\n';
        const barnItems = [
            { id: 'fertilizer', emoji: '💰' },
            { id: 'cotton', emoji: '☁️' },
            { id: 'linen', emoji: '📜' },
            { id: 'counterfeit', emoji: '💵', name: 'Counterfeit Cash' }
        ];

        for (const bItem of barnItems) {
            const amount = getAmount(bItem.id);
            const amtStr = formatBigNumber(amount);

            // Fallback lookup
            const iDef = items[bItem.id];
            const name = bItem.name || (iDef ? iDef.name : bItem.id);
            // Use local override emoji if present (e.g. cloud for cotton in barn section specifically? Screenshot shows specific icons for Barn items that differ from plant emojis)
            // Screenshot Barn:
            // Fertilizer: Bag 💰
            // Cotton: Cloud ☁️
            // Linen: Scroll 📜
            // Counterfeit: Cash 💵
            // My items.ts has `cotton_plant` (🌿) vs `cotton` (Material).
            // `items.ts`: 'cotton': { id: 'cotton', name: 'Cotton', ... } -> Emoji?
            // In items.ts I didn't set emojis for `cotton` (material) yet. I set it for `cotton_plant`.
            // So I will use the hardcoded emojis in `barnItems` array above to match the look.
            const emoji = bItem.emoji;

            barnText += `${emoji} ${name} | ${amtStr}\n`;
        }

        const fullDescription = (embed.data.description || '') + '\n' + cropsText + '\n' + barnText;
        embed.setDescription(fullDescription);

        message.reply({ embeds: [embed] });
    },
};

export default command;
