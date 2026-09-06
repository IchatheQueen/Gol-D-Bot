import { Message, Client, EmbedBuilder } from 'discord.js';
import db from '../../database/db';
import { getInventory, removeInventoryItem, addInventoryItem } from '../../database/inventory';
import { rollVaultToken, VAULT_TOKEN_CHANCE_PVE } from '../../database/vault';
import { rollEventCurrency } from '../../database/events';
import { Command } from '../../handlers/commandHandler';
import { items } from '../../data/items';

// Plant definitions
/**
 * Yields and timers here must match what the black market advertises when
 * these plants are sold (see data/blackMarketItems.ts). They previously did
 * not: 104 and 105 were swapped, so buying a Cotton Plant harvested linen,
 * and every yield/timer disagreed with its shop description.
 */
/**
 * Every crop shares one harvest cooldown.
 *
 * Crops used to each carry their own timer (6h/20h/12h/8h). That was unified
 * to a flat 12 hours, then cut to 6 and again to 3 as compensation for the
 * vault rework's upgrade costs and the money-maker investment cap.
 */
export const HARVEST_COOLDOWN_MS = 3 * 60 * 60 * 1000;

export const plants: Record<string, { harvestItem: string; harvestAmount: number; harvestTime: number; riskFactor: number }> = {
    // Cannabis Plant — yields 🌿 2
    '102': { harvestItem: 'weed', harvestAmount: 2, harvestTime: HARVEST_COOLDOWN_MS, riskFactor: 0.10 },
    // Opium Poppy — yields 💊 1. Higher risk since it sells for more.
    '103': { harvestItem: 'opioid', harvestAmount: 1, harvestTime: HARVEST_COOLDOWN_MS, riskFactor: 0.20 },
    // Cotton Plant — yields ☁️ 2
    '104': { harvestItem: 'cotton', harvestAmount: 2, harvestTime: HARVEST_COOLDOWN_MS, riskFactor: 0.10 },
    // Linen Plant — yields 📜 4
    '105': { harvestItem: 'linen', harvestAmount: 4, harvestTime: HARVEST_COOLDOWN_MS, riskFactor: 0.10 },
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

        // Harvesting is one of the PvE sources of Vault Tokens. Only roll when
        // something actually came out of the ground.
        if (totalHarvested > 0 && await rollVaultToken(userId, VAULT_TOKEN_CHANCE_PVE)) {
            harvestDescription += `🎫 You found a **Vault Token** among the crops!\n`;
        }

        if (totalHarvested > 0) {
            const found = await rollEventCurrency(userId);
            if (found) {
                harvestDescription += `${found.event.currencyEmoji} You found **${found.amount} ${found.event.currencyName}** among the crops!\n`;
            }
        }

        embed.setDescription(harvestDescription);
        embed.setFooter({ text: `Total Harvested: ${totalHarvested} | Total Destroyed: ${totalDestroyed}` });

        message.reply({ embeds: [embed] });
    },
};

export default command;
