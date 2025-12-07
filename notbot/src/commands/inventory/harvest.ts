import { Message, Client, EmbedBuilder } from 'discord.js';
import db from '../../database/db';
import { getInventory, removeInventoryItem, addInventoryItem } from '../../database/inventory';
import { Command } from '../../handlers/commandHandler';
import { items } from '../../data/items';

// Plant definitions
const plants: Record<string, { harvestItem: string; harvestAmount: number; harvestTime: number; riskFactor: number }> = {
    '102': { harvestItem: '1', harvestAmount: 3, harvestTime: 12 * 60 * 60 * 1000, riskFactor: 0.10 }, // Weed
    '103': { harvestItem: '3', harvestAmount: 1, harvestTime: 12 * 60 * 60 * 1000, riskFactor: 0.20 }, // Opioid
    '104': { harvestItem: 'linen', harvestAmount: 1, harvestTime: 12 * 60 * 60 * 1000, riskFactor: 0.10 },
    '105': { harvestItem: 'cotton', harvestAmount: 1, harvestTime: 12 * 60 * 60 * 1000, riskFactor: 0.10 },
};

const command: Command = {
    name: 'harvest',
    description: 'Harvest your crops',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;

        // Fetch all plant items from inventory
        const plantIds = Object.keys(plants);
        const inventory = await getInventory(userId);
        const userPlants = inventory.filter(i => plantIds.includes(i.item_id) && i.amount > 0n);

        if (userPlants.length === 0) {
            message.reply('You don\'t have any plants to harvest!');
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle('🌾 Harvest Results')
            .setColor('#00ff00');

        let harvestDescription = '';
        let totalHarvested = 0;
        let totalDestroyed = 0;

        for (const item of userPlants) {
            const plantDef = plants[item.item_id];
            const itemDef = items[item.item_id];

            if (!plantDef || !itemDef) continue;

            // Check cooldown for harvest
            const cooldownKey = `harvest_${item.item_id}`;
            const cooldownCheck = await db.execute({
                sql: 'SELECT * FROM cooldowns WHERE user_id = ? AND command = ?',
                args: [userId, cooldownKey]
            });
            const cooldown = cooldownCheck.rows[0] as any;

            if (cooldown) {
                const timeLeft = Number(cooldown.timestamp) + plantDef.harvestTime - Date.now();
                if (timeLeft > 0) {
                    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
                    const minutes = Math.ceil((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
                    harvestDescription += `⏳ **${itemDef.name}**: Not ready yet (${hours}h ${minutes}m)\n`;
                    continue;
                }
            }

            // Calculate risk (10% of plants destroyed)
            const plantsToProcess = Number(item.amount); // Assuming plant counts fit in number for calculation
            const plantsDestroyed = Math.floor(plantsToProcess * plantDef.riskFactor);
            const plantsHarvested = plantsToProcess - plantsDestroyed;

            if (plantsDestroyed > 0) {
                // Destroy plants
                await removeInventoryItem(userId, item.item_id, BigInt(plantsDestroyed));
                totalDestroyed += plantsDestroyed;
                harvestDescription += `🪳 **${plantsDestroyed}x ${itemDef.name}** destroyed by bugs!\n`;
            }

            if (plantsHarvested > 0) {
                // Give harvest items
                const harvestAmount = plantsHarvested * plantDef.harvestAmount;
                await addInventoryItem(userId, plantDef.harvestItem, BigInt(harvestAmount));

                const harvestItemDef = items[plantDef.harvestItem];
                harvestDescription += `✅ **${itemDef.name}**: Harvested **${harvestAmount}x ${harvestItemDef?.name || plantDef.harvestItem}**\n`;
                totalHarvested += harvestAmount;
            }

            // Set cooldown
            await db.execute({
                sql: 'INSERT OR REPLACE INTO cooldowns (user_id, command, timestamp) VALUES (?, ?, ?)',
                args: [userId, cooldownKey, Date.now()]
            });
        }

        if (harvestDescription === '') {
            harvestDescription = 'Nothing to harvest at this time.';
        }

        embed.setDescription(harvestDescription);
        embed.setFooter({ text: `Total Harvested: ${totalHarvested} | Total Destroyed: ${totalDestroyed}` });

        message.reply({ embeds: [embed] });
    },
};

export default command;
