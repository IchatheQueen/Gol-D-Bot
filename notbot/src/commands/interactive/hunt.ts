import { Message, Client } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';
import { getInventoryItem } from '../../database/inventory';
import { resolveEmoji } from '../../utils/resolveEmoji';

const command: Command = {
    name: 'hunt',
    description: 'Send your cat hunting',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;

        // Get pet
        const petCheck = await db.execute({
            sql: 'SELECT * FROM pets WHERE user_id = ?',
            args: [userId]
        });
        const pet = petCheck.rows[0] as any;

        if (!pet) {
            message.reply('You don\'t have a cat! Use `~cat` to adopt one.');
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

        // Energy cost based on endurance: max(5, 36 - endurance)
        const energyCost = Math.max(5, 36 - pet.endurance);

        if (pet.energy < energyCost) {
            message.reply('Your cat is too tired to hunt!');
            return;
        }

        // Deduct energy
        await db.execute({
            sql: 'UPDATE pets SET energy = energy - ? WHERE user_id = ?',
            args: [energyCost, userId]
        });

        // XP gain based on intellect
        const baseXP = 100;
        const intellectBonus = pet.intellect * 50;
        const variance = Math.floor(Math.random() * 50) - 25;
        const xpGained = baseXP + intellectBonus + variance;

        // Determine catch type based on level
        let catchType = 'Fish';
        let catchEmoji = '🐟';

        if (pet.level >= 30) {
            catchType = 'Shark';
            catchEmoji = '🦈';
        } else if (pet.level >= 10) {
            catchType = 'Dolphin';
            catchEmoji = '🐬';
        }

        // Update XP
        const newXP = pet.experience + xpGained;
        const xpForNextLevel = 400 * pet.level;

        let levelUpMessage = '';

        if (newXP >= xpForNextLevel) {
            // Level up!
            const newLevel = pet.level + 1;
            await db.execute({
                sql: 'UPDATE pets SET level = ?, experience = ?, credits = credits + 1 WHERE user_id = ?',
                args: [newLevel, newXP - xpForNextLevel, userId]
            });

            levelUpMessage = `\n🎉 **Level Up!** Your cat is now level ${newLevel}! Earned 🍥 1 Cat Credit.`;
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

        // Resolve emoji (using lowercase catchType as key, e.g. 'shark', 'dolphin')
        const resolvedEmoji = resolveEmoji(client, catchType.toLowerCase(), catchEmoji);

        message.reply(
            `**${message.author.username}'s [Lvl ${pet.level}] ${pet.name}** went hunting!\n\n` +
            `🔋 **Energy consumed**: ${energyCost}\n` +
            `${resolvedEmoji} **Caught**: ${catchType}\n` +
            `⭐ **XP gained**: ${xpGained}` +
            levelUpMessage
        );
    },
};

export default command;
