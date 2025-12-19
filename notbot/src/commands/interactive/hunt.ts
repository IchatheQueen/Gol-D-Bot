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
        let pet = await updatePetStats(userId);

        if (!pet) {
            message.reply('You don\'t have a cat! Use `~cat` to adopt one.');
            return;
        }

        if (isPetDead(pet)) {
            message.reply(`Your [Lvl ${pet.level}] Cat is dead 💀. You must revive it first!`);
            return;
        }

        // Check cooldown (5 seconds base)
        const cooldownCheck = await db.execute({
            sql: 'SELECT timestamp FROM cooldowns WHERE user_id = ? AND command = ?',
            args: [userId, 'hunt']
        });

        const now = Date.now();
        if (cooldownCheck.rows.length > 0) {
            const timeLeft = Number(cooldownCheck.rows[0].timestamp) + 5000 - now;
            if (timeLeft > 0) {
                const seconds = Math.ceil(timeLeft / 1000);
                message.reply(`You can hunt again in ${seconds} second(s).`);
                return;
            }
        }

        // Fixed energy cost to 3
        const energyCost = 3;

        if (pet.energy < energyCost) {
            message.reply(`Your cat is all out of energy! 🔋 wait for it to restore to **${energyCost} 🔋** and try again`);
            return;
        }

        // Deduct energy
        await db.execute({
            sql: 'UPDATE pets SET energy = energy - ? WHERE user_id = ?',
            args: [energyCost, userId]
        });

        // Rewards logic
        const chance = Math.random();
        let catchMsg = '';
        let xpGained = 0;

        if (chance < 0.4) {
            // Fail but gain fail-safe XP
            xpGained = 150 + Math.floor(Math.random() * 100);
            catchMsg = `came back empty-handed but still learned something`;
        } else {
            // Success
            xpGained = 500 + Math.floor(Math.random() * 500);
            const fishCount = 5 + Math.floor(Math.random() * 10);
            await db.execute({
                sql: `INSERT INTO inventory (user_id, item_id, amount) VALUES (?, 'fish', ?) 
                      ON CONFLICT(user_id, item_id) DO UPDATE SET amount = amount + ?`,
                args: [userId, fishCount, fishCount]
            });
            catchMsg = `caught 🐟 ${fishCount}`;
        }

        // Update XP/Level
        const currentXp = BigInt(pet.experience) + BigInt(xpGained);
        const nextLevelXp = BigInt(Math.floor(400 * Math.pow(1.5, pet.level - 1 || 0))); // Lvl 1 -> 400

        if (currentXp >= nextLevelXp) {
            await db.execute({
                sql: 'UPDATE pets SET level = level + 1, experience = 0, credits = credits + 1 WHERE user_id = ?',
                args: [userId]
            });
        } else {
            await db.execute({
                sql: 'UPDATE pets SET experience = ? WHERE user_id = ?',
                args: [currentXp.toString(), userId]
            });
        }

        // Set cooldown
        await db.execute({
            sql: 'INSERT OR REPLACE INTO cooldowns (user_id, command, timestamp) VALUES (?, ?, ?)',
            args: [userId, 'hunt', now]
        });

        const embed1 = {
            description: `${message.author.username}'s [Lvl ${pet.level}] Cat has flown away in search of prey and consumed 🔋 ${energyCost}`,
            color: 0x2b2d31
        };

        const embed2 = {
            description: `${message.author.username}'s [Lvl ${pet.level}] Cat ${catchMsg} and gained 💧 ${xpGained} Exp`,
            color: 0x2b2d31
        };

        await message.reply({ embeds: [embed1, embed2] });
    },
};

export default command;
