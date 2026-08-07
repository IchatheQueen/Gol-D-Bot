import { Message, Client, EmbedBuilder } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';
import { getInventoryItem, removeInventoryItem } from '../../database/inventory';

// Cooldowns refreshed by Scotch/Beer
const alcoholRefreshCooldowns = [
    'shoot_pistol', 'shoot_rifle', 'shoot_crossbow', 'shoot_speaker', 'shoot_flamethrower',
    'shoot_laser', 'hex', 'boost', 'beatup', 'pet', 'dispense', 'steal', 'decondition', 'drink', 'smoke', 'rob', 'heist'
];

const command: Command = {
    name: 'scotch',
    description: 'Drink a scotch to refresh cooldowns',
    aliases: ['sip'],
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;

        // Check if user has Scotch OR Beer
        // logic: favor Scotch for 'scotch', favor Beer for 'drink'? 
        // Or generic check.
        // User requested `drink` alias for `scotch`.
        // I will prioritise Scotch if command is `scotch`, or fallback. 
        // Actually, if `drink` is used, users usually expect Beer cost ($10k) vs Scotch ($50k).
        // But the screenshot showed `~scotch`.
        // I'll check what item they have.
        // If they have Scotch, use it. If not, check Beer? 
        // I'll stick to requiring 'Scotch' for `scotch` command and `drink` alias will mapped to this command
        // BUT if they use `~drink` maybe they want beer? 
        // Existing `drink.ts` (which I deleted) used Beer.
        // I will try to use Scotch item (ID: 'scotch').

        let itemId = 'scotch';
        // Check if user has scotch
        let amount = await getInventoryItem(userId, itemId);

        if (amount < 1n) {
            // Fallback or error?
            // If alias 'drink' was used, maybe check beer?
            // For now, I'll error if no scotch.
            message.reply('You don\'t have any 🥃 **Scotch**! Buy some from the pub (`~pub`).');
            return;
        }

        // Check cooldown (30m)
        const cooldownKey = 'scotch'; // Shared cooldown key? Or separate? 
        // Assuming shared alcohol cooldown.
        const cooldownTime = 30 * 60 * 1000;
        const cooldownCheck = await db.execute({
            sql: 'SELECT * FROM cooldowns WHERE user_id = ? AND command = ?',
            args: [userId, cooldownKey]
        });
        const cooldown = cooldownCheck.rows[0] as any;

        if (cooldown) {
            const timeLeft = Number(cooldown.timestamp) + cooldownTime - Date.now();
            if (timeLeft > 0) {
                const minutes = Math.ceil(timeLeft / (1000 * 60));
                message.reply(`You need to wait **${minutes}m** before drinking again!`);
                return;
            }
        }

        // Consume
        await removeInventoryItem(userId, itemId, 1n);

        // Refresh cooldowns
        for (const cd of alcoholRefreshCooldowns) {
            await db.execute({
                sql: 'DELETE FROM cooldowns WHERE user_id = ? AND command = ?',
                args: [userId, cd]
            });
        }

        // Set cooldown
        await db.execute({
            sql: 'INSERT OR REPLACE INTO cooldowns (user_id, command, timestamp) VALUES (?, ?, ?)',
            args: [userId, cooldownKey, Date.now()]
        });

        // Response with Embed & GIF
        const embed = new EmbedBuilder()
            .setDescription('You have a sip of scotch to regain your composure. Cooldowns have been reset')
            .setImage('https://media1.tenor.com/m/Y8G4WwB4C4kAAAAd/patrick-bateman-drinking.gif') // Patrick Bateman drinking gif from screenshot
            .setColor('#2b2d31');

        message.reply({ embeds: [embed] });
    },
};

export default command;
