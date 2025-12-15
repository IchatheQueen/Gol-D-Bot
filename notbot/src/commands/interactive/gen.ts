import { Message, Client, EmbedBuilder, AttachmentBuilder } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';
import { getInventoryItem, addInventoryItem } from '../../database/inventory';
import { formatBigNumber, parseBigNumber } from '../../utils/bigNumbers';
import { resolveTarget } from '../../utils/resolveTarget';

// config
const BASE_LEVEL_COST = 1000n;
const COST_MULTIPLIER = 1.5; // Exponential growth

const command: Command = {
    name: 'gen',
    description: 'Cat Pill Generator',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;
        const subCommand = args[0]?.toLowerCase();

        // 1. Fetch Generator Data
        let genRes = await db.execute({ sql: 'SELECT * FROM generators WHERE user_id = ?', args: [userId] });

        if (genRes.rows.length === 0) {
            // Initialize
            await db.execute({ sql: 'INSERT INTO generators (user_id) VALUES (?)', args: [userId] });
            genRes = await db.execute({ sql: 'SELECT * FROM generators WHERE user_id = ?', args: [userId] });
        }

        const gen = genRes.rows[0] as any;

        // Helper to calculate cost for next level
        // Cost = BASE * (1.5 ^ Level) 
        // Using rough estimation for BigInt since Math.pow doesn't support n. 
        // We can store 'invested' and 'required'. 
        // Let's use a simpler BigInt progression or external lib logic. 
        // User has 10^144. 1.5^300 is roughly 5e52. 10^144 is huge.
        // Let's just double cost every level for simplicity or 1.1x.
        // 1.1^300 = 2e12. 
        // To hit 10^144 at level 300, multiplier must be large. ~3.0?
        // Let's just use current_level * huge_number for now, or just a custom growth function.
        // For now: Cost = 1000 * (2 ^ Level)
        const getLevelCost = (lvl: number) => {
            if (lvl === 0) return 1000n;
            // 2^lvl can get big fast. 2^300 has ~90 digits. 
            // 2^480 has ~144 digits. So 2x doubling is close enough to user vibe.
            return 1000n * (2n ** BigInt(lvl));
        };

        const currentLevel = gen.level as number;
        const totalInvested = BigInt(gen.invested || '0');
        const nextLevelCost = getLevelCost(currentLevel);
        const needed = nextLevelCost - totalInvested; // Actually, usually you invest to fill the bar. 
        // Let's say 'invested' is progress towards current level. reset on level up?
        // Or 'invested' is total accumulated? 
        // Screenshot: "Invested - ... needed for level up".
        // Let's assume 'invested' helps fill 'nextLevelCost'.

        if (!subCommand || subCommand === 'help') {
            // Show Status
            const embed = new EmbedBuilder()
                .setTitle('🏭 | Cat Pill Generator')
                .setColor('#2F3136')
                .setDescription(`\`~gen help\` for some help\n\n**Base**\n⭐ Level - ${gen.level}\n💰 Invested - 💵 ${formatBigNumber(totalInvested)} (${totalInvested.toString().length} digits)\n└💵 ${formatBigNumber(needed > 0n ? needed : 0n)} (${(needed > 0n ? needed : 0n).toString().length} digits) needed for level up\n\n**Stats**\n🪙 Credits - ${gen.points}\n💥 Potency - ${gen.stat_potency}\n⏲️ Efficiency - ${gen.stat_efficiency} [${Math.floor(gen.stat_efficiency / 2)}-${gen.stat_efficiency} pills produced]\n💗 Health - ${gen.stat_health}\n🍗 Hunger - ${gen.stat_hunger}\n💧 Thirst - ${gen.stat_thirst}\n🔋 Energy - ${gen.stat_energy}\n🔥 Strength - ${gen.stat_strength}\n⚡ Agility - ${gen.stat_agility}\n🤓 Intellect - ${gen.stat_intellect}\n🛡️ Endurance - ${gen.stat_endurance}`);

            message.reply({ embeds: [embed] });
            return;
        }

        if (subCommand === 'invest') {
            const amountStr = args[1];
            let amount = 0n;

            const userRes = await db.execute({ sql: 'SELECT credits FROM users WHERE id = ?', args: [userId] });
            const userCredits = BigInt((userRes.rows[0]?.credits as string) || '0');

            if (amountStr === 'all') amount = userCredits;
            else amount = parseBigNumber(amountStr) || 0n;

            if (amount <= 0n) { message.reply('Invalid amount.'); return; }
            if (userCredits < amount) { message.reply('Insufficient credits.'); return; }

            // Deduct
            await db.execute({ sql: 'UPDATE users SET credits = credits - ? WHERE id = ?', args: [amount.toString(), userId] });

            // Add to invested
            let newInvested = totalInvested + amount;

            // Check Level Up
            // If newInvested >= nextLevelCost, Level Up!
            // Handle multiple levels?
            let newLevel = currentLevel;
            let pointsGained = 0;
            let cost = getLevelCost(newLevel);

            // Simple loop for potential multi-level
            while (newInvested >= cost) {
                newInvested -= cost;
                newLevel++;
                pointsGained += 1; // 1 Point per level? Or more?
                cost = getLevelCost(newLevel);
            }

            await db.execute({
                sql: 'UPDATE generators SET level = ?, invested = ?, points = points + ? WHERE user_id = ?',
                args: [newLevel, newInvested.toString(), pointsGained, userId]
            });

            message.reply(`Invested 💵 ${formatBigNumber(amount)}! You are now Level ${newLevel}. Points: +${pointsGained}`);
            return;
        }

        if (subCommand === 'improve') {
            const statMap: any = {
                'effi': 'stat_efficiency', 'efficiency': 'stat_efficiency',
                'pot': 'stat_potency', 'potency': 'stat_potency',
                'health': 'stat_health', 'hunger': 'stat_hunger',
                'thirst': 'stat_thirst', 'energy': 'stat_energy',
                'str': 'stat_strength', 'strength': 'stat_strength',
                'agi': 'stat_agility', 'agility': 'stat_agility',
                'int': 'stat_intellect', 'intellect': 'stat_intellect',
                'end': 'stat_endurance', 'endurance': 'stat_endurance',
                'meta': 'stat_metabolism', 'metabolism': 'stat_metabolism'
            };

            const type = args[1]?.toLowerCase();
            const amount = parseInt(args[2]);
            const dbCol = statMap[type];

            if (!dbCol || !amount || amount <= 0) {
                message.reply('Usage: `~gen improve <stat> <amount>`');
                return;
            }

            if (gen.points < amount) {
                message.reply(`Not enough points. You have ${gen.points}.`);
                return;
            }

            await db.execute({
                sql: `UPDATE generators SET ${dbCol} = ${dbCol} + ?, points = points - ? WHERE user_id = ?`,
                args: [amount, amount, userId]
            });

            message.reply(`Improved **${type}** by ${amount} points.`);
            return;
        }

        if (subCommand === 'rollback') {
            const statMap: any = {
                'effi': 'stat_efficiency', 'efficiency': 'stat_efficiency',
                'pot': 'stat_potency', 'potency': 'stat_potency',
                'health': 'stat_health', 'hunger': 'stat_hunger',
                'thirst': 'stat_thirst', 'energy': 'stat_energy',
                'str': 'stat_strength', 'strength': 'stat_strength',
                'agi': 'stat_agility', 'agility': 'stat_agility',
                'int': 'stat_intellect', 'intellect': 'stat_intellect',
                'end': 'stat_endurance', 'endurance': 'stat_endurance',
                'meta': 'stat_metabolism', 'metabolism': 'stat_metabolism'
            };

            const type = args[1]?.toLowerCase();
            const amount = parseInt(args[2]);
            const dbCol = statMap[type];

            if (!dbCol || !amount || amount <= 0) {
                message.reply('Usage: `~gen rollback <stat> <amount>`');
                return;
            }

            if (gen[dbCol] < amount) {
                message.reply(`Cannot rollback more than you have (${gen[dbCol]}).`);
                return;
            }

            await db.execute({
                sql: `UPDATE generators SET ${dbCol} = ${dbCol} - ?, points = points + ? WHERE user_id = ?`,
                args: [amount, amount, userId]
            });

            message.reply(`Rolled back **${type}** by ${amount} points. Refunded ${amount} points.`);
            return;
        }

        if (subCommand === 'dispense') {
            // Production logic
            // Based on efficiency? 
            // Screenshot: "Efficiency - 22 [1-12 pills produced each time]"
            // Maybe Efficiency / 2 is max pills?
            // Let's do: Count = Random(Efficiency/2, Efficiency)

            const min = Math.max(1, Math.floor(gen.stat_efficiency / 2));
            const max = Math.max(1, gen.stat_efficiency);
            const count = Math.floor(Math.random() * (max - min + 1)) + min;

            // Cooldown? Screenshot doesn't show one, but unlimited Pills might be OP.
            // Let's add 1 hour cooldown/collection time in DB 'last_claim'.
            // "last_collection" in schema.
            const now = Date.now();
            const cooldownStr = '60 minutes';
            const cooldown = 60 * 60 * 1000;

            if (now - (gen.last_claim || 0) < cooldown) {
                const remaining = Math.ceil((cooldown - (now - gen.last_claim)) / 60000);
                message.reply(`Generator is warming up. Available in ${remaining} minutes.`);
                return;
            }

            // Update Claim Time
            await db.execute({ sql: 'UPDATE generators SET last_claim = ? WHERE user_id = ?', args: [now, userId] });

            // Add Pills to Inventory
            await addInventoryItem(userId, 'cat_pill', BigInt(count));

            message.reply(`🏭 Collected **${count}** 💊 **Cat Pills**!`);
            return;
        }
    }
};

export default command;
