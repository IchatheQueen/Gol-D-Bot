import { Message, Client, EmbedBuilder } from 'discord.js';
import db from '../../database/db';
import { getInventory } from '../../database/inventory';
import { Command } from '../../handlers/commandHandler';
import { items } from '../../data/items';

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

        // Fetch all plant items from inventory
        const plantIds = Object.keys(plants);
        const inventory = await getInventory(userId);

        // Helper to get amount
        const getAmount = (id: string) => {
            const found = inventory.find(i => i.item_id === id);
            return found ? found.amount : 0n;
        };

        const embed = new EmbedBuilder()
            .setTitle('🌱 Your Farm')
            .setColor('#00ff00');

        let farmDescription = '';

        for (const plantId of plantIds) {
            const plantDef = plants[plantId];
            const itemDef = items[plantId];

            if (!plantDef || !itemDef) continue;

            const amount = getAmount(plantId);
            // Use resolveEmoji for best results, though items.ts has unicode for plants now so direct access is fine too. 
            // Better to match style: itemDef.emoji is what we want.
            const emoji = itemDef.emoji || '🌿';

            let status = '⚪ **Not Planted**';

            if (amount > 0n) {
                // Check cooldown for harvest
                const cooldownKey = `harvest_${plantId}`;
                const cooldownCheck = await db.execute({
                    sql: 'SELECT * FROM cooldowns WHERE user_id = ? AND command = ?',
                    args: [userId, cooldownKey]
                });
                const cooldown = cooldownCheck.rows[0] as any;

                status = '✅ **Ready to Harvest**';
                if (cooldown) {
                    const timeLeft = Number(cooldown.timestamp) + plantDef.harvestTime - Date.now();
                    if (timeLeft > 0) {
                        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
                        const minutes = Math.ceil((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
                        status = `⏳ **${hours}h ${minutes}m** remaining`;
                    }
                }
            }

            farmDescription += `${emoji} **${itemDef.name}** (x${amount.toLocaleString()})\n${status}\n\n`;
        }

        embed.setDescription(farmDescription || 'No plants found.');
        embed.setFooter({ text: 'Use ~harvest to collect your crops!' });

        message.reply({ embeds: [embed] });
    },
};

export default command;
