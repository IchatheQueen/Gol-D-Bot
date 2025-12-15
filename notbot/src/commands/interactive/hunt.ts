import { Message, Client } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';
import { getInventoryItem } from '../../database/inventory';
import { resolveEmoji } from '../../utils/resolveEmoji';
import { updatePetStats, isPetDead } from '../../utils/petUtils';

const command: Command = {
    name: 'hunt',
    description: 'Send your cat hunting',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;

        // Get pet
        const pet = await updatePetStats(userId);

        if (!pet) {
            message.reply('You don\'t have a cat! Use `~cat` to adopt one.');
            return;
        }

        if (isPetDead(pet)) {
            message.reply('Your cat is dead 💀. You must revive it with `~revive` before it can hunt!');
            return;
        }

        // Check cooldown (20s base, 12s with Junkie)
        const cooldownCheck = await db.execute({
            sql: 'SELECT * FROM cooldowns WHERE user_id = ? AND command = ?',
            args: [userId, 'hunt']
        });
        const cooldown = cooldownCheck.rows[0] as any;

        // Check for Junkie buff (p8 in inventory)
        const junkieAmount = await getInventoryItem(userId, 'p8');
        const hasJunkie = junkieAmount > 0n;
        const cooldownSeconds = hasJunkie ? 12 : 20;

        if (cooldown) {
            const timeLeft = Number(cooldown.timestamp) + (cooldownSeconds * 1000) - Date.now();
            if (timeLeft > 0) {
                const seconds = Math.ceil(timeLeft / 1000);
                message.reply(`You can hunt again in ${seconds} second(s).`);
                return;
            }
        }

        // Fixed energy cost
        const energyCost = 35;

        if (pet.energy < energyCost) {
            message.reply('Your cat is too tired to hunt!');
            return;
        }

        // Deduct energy
        await db.execute({
            sql: 'UPDATE pets SET energy = energy - ? WHERE user_id = ?',
            args: [energyCost, userId]
        });

        // Check Support Server Membership for XP Boost
        const SUPPORT_GUILD_ID = '1341830866657083402';
        let isSupportMember = false;
        try {
            const supportGuild = client.guilds.cache.get(SUPPORT_GUILD_ID);
            if (supportGuild) {
                // Check cache first for speed, then fetch if needed? 
                // We'll just try to fetch to be safe.
                await supportGuild.members.fetch(userId);
                isSupportMember = true;
            }
        } catch (e) {
            isSupportMember = false;
        }

        // Rewards
        let xpGained = 300; // Base XP
        let xpBonusPercent = 0;

        // Apply Boosts
        if (isSupportMember) {
            xpGained = Math.floor(xpGained * 1.10); // +10%
            xpBonusPercent += 10;
        }

        const xpBonusDisplay = 120.0 + xpBonusPercent; // "120%" base visual + bonus
        const fishAmount = 15;
        const fishId = 'fish';

        // Add items to inventory
        await db.execute({
            sql: `INSERT INTO inventory (user_id, item_id, amount) VALUES (?, ?, ?) 
                  ON CONFLICT(user_id, item_id) DO UPDATE SET amount = amount + ?`,
            args: [userId, fishId, fishAmount, fishAmount]
        });

        // Update XP
        const newXP = pet.experience + xpGained;
        const xpForNextLevel = 400 * pet.level; // From screenshot 0/400 for Lvl 1

        let levelUpMessage = '';
        let petLevel = pet.level;

        if (newXP >= xpForNextLevel) {
            // Level up
            petLevel++;
            await db.execute({
                sql: 'UPDATE pets SET level = ?, experience = ?, credits = credits + 1 WHERE user_id = ?',
                args: [petLevel, newXP - xpForNextLevel, userId]
            });
            // The screenshot doesn't show level up message, maybe it happens in next hunt or separate msg.
            // But existing logic had it. I'll suppress it to match "exact look" or maybe append it?
            // Screenshot has a "Boost..." message.
        } else {
            await db.execute({
                sql: 'UPDATE pets SET experience = ? WHERE user_id = ?',
                args: [newXP, userId]
            });
        }

        // Set cooldown
        await db.execute({
            sql: 'INSERT OR REPLACE INTO cooldowns (user_id, command, timestamp) VALUES (?, ?, ?)',
            args: [userId, 'hunt', Date.now()]
        });

        const petType = 'Cat'; // 'Cat' from screenshot. Pet schema might have type column, assuming 'Cat' for now or `pet.name` if that's the type.
        // Actually structure is `[Lvl 1] Cat`. If user named it "Fluffy", usually bots show `[Lvl 1] Fluffy` or `[Lvl 1] Cat`. Screenshot says `[Lvl 1] Cat`.
        // I will use `pet.name` if it's "Cat", otherwise `pet.type` if available, or static "Cat" since `~cat` is the command.

        const embed1 = {
            description: `${message.author.username}'s [Lvl ${pet.level}] Cat has flown away in search of prey and consumed 🔋 ${energyCost}`,
            color: 0x2b2d31 // Dark theme color
        };

        let footerMsg = `Boost your hunting experience and much more with 🌕 **GoldBot Gold** \`~patreon\`!`;
        if (!isSupportMember) {
            footerMsg += `\n🚀 **Join the Support Server for +10% XP Boost!** \`~support\` to join.`;
        }

        const embed2 = {
            description: `${message.author.username}'s [Lvl ${pet.level}] Cat has caught 🐟 ${fishAmount} and gained 💧 ${xpGained} (+${xpBonusDisplay.toFixed(1)}% Exp)\n${footerMsg}`,
            color: 0x2b2d31
        };

        await message.reply({ embeds: [embed1, embed2] });
    },
};

export default command;
