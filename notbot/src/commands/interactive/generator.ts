
import { Message, Client, EmbedBuilder } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';
import { getUserColor } from '../../database/userColor';
import { resolveEmoji } from '../../utils/resolveEmoji';
import { formatBigNumber } from '../../utils/bigNumbers';

const command: Command = {
    name: 'generator',
    description: 'View your Cat Pill Generator',
    aliases: ['gen', 'gaygen'],
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;

        // Check ownership first
        const { getInventoryItem } = await import('../../database/inventory'); // Dynamic import or add to top
        const generatorAmount = await getInventoryItem(userId, 'pill_generator');

        if (generatorAmount <= 0n) {
            message.reply('You do not have a 🗜️; `~petshop` to buy one');
            return;
        }

        // Fetch generator data
        let generatorCheck = await db.execute({
            sql: 'SELECT * FROM generators WHERE user_id = ?',
            args: [userId]
        });

        if (generatorCheck.rows.length === 0) {
            // Create generator record if they own the item but no DB record exists yet
            await db.execute({
                sql: 'INSERT INTO generators (user_id) VALUES (?)',
                args: [userId]
            });
            generatorCheck = await db.execute({
                sql: 'SELECT * FROM generators WHERE user_id = ?',
                args: [userId]
            });
        }

        const gen = generatorCheck.rows[0] as any;

        // Calculate needed for level up (placeholder logic: 900 * level?)
        // Calculate needed for level up using exponential growth (900 * 3^(level-1))
        let cost = 900n;
        const targetLevel = gen.level as number;
        for (let i = 1; i < targetLevel; i++) {
            cost = cost * 3n;
        }

        let formattedNeeded = '';
        if (cost.toString().length > 21) {
            const formatted = formatBigNumber(cost);
            if (formatted.includes('&')) {
                const [visible, hiddenCount] = formatted.split('&');
                const totalDigits = cost.toString().length;
                formattedNeeded = `${visible}... (${totalDigits} digits)`;
            } else {
                formattedNeeded = formatted;
            }
        } else {
            formattedNeeded = formatBigNumber(cost);
        }

        const neededForLevelUp = formattedNeeded;

        // Values formatting
        // Health: base 12 * level? Or specific formula? Screenshot says Level 1 -> 12.
        const healthVal = 12 * gen.health_level;
        const hungerVal = 9 * gen.hunger_level;
        const thirstVal = 15 * gen.thirst_level;
        const energyVal = 12 * gen.energy_level;

        // Boosts
        const strengthVal = `${(1 + gen.strength_level)}x`; // Screenshot Lvl 1 -> 2x implies 1+1
        const agilityVal = `${(1 + gen.agility_level)}x`;
        const intellectVal = `${(1 + gen.intellect_level)}x`;
        const enduranceVal = `${(1 + gen.endurance_level)}x`;

        // Modifiers for Pill Generator stats
        const potencyTime = 21; // Minutes base? Screenshot: "1 [21 minutes]"
        const efficiencyRange = "1-2"; // Screenshot: "1 [1-2 pills produced each time]"

        // Emojis (resolve or default)
        // Hardcoding standard ones matching screenshot for now, resolveEmoji if custom needed later
        // Screenshot icons:
        // C-clamp icon? 🗜️ | Cat Pill Generator
        // Level: 💫
        // Invested: 💰
        // Credits: 🏵️ (flower/cookie?) -> Screenshot looks like orange flower.
        // Potency: 💥
        // Efficiency: ⏲️
        // Health: 🧴 (screenshot has girl icon?) -> Wait, screenshot: "Health - 1 [❤️ 12]" (Using standard heart)
        // Hunger: 💊 (Screenshot has pill bottle?) -> "Hunger - 1 [💊 9]"
        // Thirst: 💧
        // Energy: 🔋
        // Strength: 🔥
        // Agility: ⚡
        // Intellect: 😎
        // Endurance: 🥥 (Coconut? or shield?) -> Screenshot looks like a person? Or angel? 
        // Wait, "Endurance - 1 [2x]" icon is 🧔 (Bearded person? or specific custom emoji). 
        // Let's use generic approximation or custom if provided. Screenshot endurance icon looks like... a potato/stone/head?
        // Let's use 🛡️ as fallback.

        const embed = new EmbedBuilder()
            .setTitle('🗜️ | Cat Pill Generator') // Clamp?
            .setDescription(`Built by ${message.author.username} (@${message.author.username})\n\`GAYgen help\` for some help`)
            .setColor(getUserColor(userId))
            .addFields(
                {
                    name: 'Base',
                    value: `💫 Level - ${gen.level}\n💰 Invested - 💵 ${gen.invested}\n└ 💵 ${neededForLevelUp} needed for level up`,
                    inline: false
                },
                {
                    name: 'Stats',
                    value: `🏵️ Credits - ${gen.credits}\n` +
                        `💥 Potency - ${gen.potency_level} [${potencyTime} minutes]\n` +
                        `⏲️ Efficiency - ${gen.efficiency_level} [${efficiencyRange} pills produced each time]\n` +
                        `❤️ Health - ${gen.health_level} [❤️ ${healthVal}]\n` +
                        `💊 Hunger - ${gen.hunger_level} [💊 ${hungerVal}]\n` +
                        `💧 Thirst - ${gen.thirst_level} [💧 ${thirstVal}]\n` +
                        `🔋 Energy - ${gen.energy_level} [🔋 ${energyVal}]\n` +
                        `🔥 Strength - ${gen.strength_level} [${strengthVal}]\n` +
                        `⚡ Agility - ${gen.agility_level} [${agilityVal}]\n` +
                        `😎 Intellect - ${gen.intellect_level} [${intellectVal}]\n` +
                        `🛡️ Endurance - ${gen.endurance_level} [${enduranceVal}]\n` +
                        `🥓 Metabolism - ${gen.level} [${gen.level}x]`, // Added Metabolism to match Pet screenshot style if needed, though Generator screenshot didn't show it explicitly initially? Wait, "Endurance" was last line in screenshot. I'll stick to screenshot.
                    inline: false
                }
            )
            .setFooter({ text: 'Spice up your cat with a cosmetic skin via ~market' }); // Copied from pet screenshot, maybe not applicable to generator? Screenshot doesn't show footer. Removed.

        // Actually screenshot does NOT have footer about market. It ends at Endurance.

        await message.reply({ embeds: [embed] });
    }
};

export default command;
