import { Message, Client, EmbedBuilder } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';
import { getInventoryItem, removeInventoryItem } from '../../database/inventory';

// Drug definitions
const drugs: Record<string, {
    id: string;
    name: string;
    cooldown: number;
    duration: number;
    refreshCooldowns: string[];
    description: string;
}> = {
    'opi': {
        id: '3', // Opioid BM ID
        name: 'Opioid',
        cooldown: 6 * 60 * 60 * 1000, // 6h
        duration: 30 * 60 * 1000, // 30m
        refreshCooldowns: [
            'shoot_pistol', 'shoot_rifle', 'shoot_crossbow', 'shoot_speaker', 'shoot_flamethrower',
            'hex', 'boost', 'beatup', 'pet', 'dispense', 'steal', 'decondition', 'drink', 'smoke'
        ],
        description: 'Halves cooldowns & immune to attacks for 30m'
    },
    'ster': {
        id: '4', // Steroid BM ID
        name: 'Steroid',
        cooldown: 12 * 60 * 60 * 1000, // 12h
        duration: 30 * 60 * 1000, // 30m
        refreshCooldowns: [],
        description: 'Reduces cooldowns by 3/4 & access to ~beatup for 30m'
    },
    'anes': {
        id: '5', // Anesthesia BM ID
        name: 'Anesthesia',
        cooldown: 12 * 60 * 60 * 1000, // 12h
        duration: 30 * 60 * 1000, // 30m (default, can be customized)
        refreshCooldowns: [],
        description: 'Immune to attacks but cannot use commands'
    },
    'copium': {
        id: '5', // Anesthesia (free alias)
        name: 'Copium (Anesthesia)',
        cooldown: 12 * 60 * 60 * 1000,
        duration: 30 * 60 * 1000,
        refreshCooldowns: [],
        description: 'Free alias for Anesthesia'
    },
    'lsd': {
        id: '6', // LSD BM ID
        name: 'LSD',
        cooldown: 12 * 60 * 60 * 1000, // 12h
        duration: 15 * 60 * 1000, // 15m
        refreshCooldowns: [
            'shoot_pistol', 'shoot_rifle', 'shoot_crossbow', 'shoot_speaker', 'shoot_flamethrower',
            'hex', 'boost', 'dispense', 'steal', 'decondition'
        ],
        description: '1/3 chance commands fail, 15s global cooldown, but refreshes cooldowns every 15s'
    },
};

const command: Command = {
    name: 'dose',
    description: 'Take a dose of a drug',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;
        const drugKey = args[0]?.toLowerCase();
        const durationArg = parseInt(args[1]);

        if (!drugKey || !drugs[drugKey]) {
            message.reply('Usage: `~dose <opi|ster|anes|copium|lsd> [time (for anes)]`');
            return;
        }

        const drug = drugs[drugKey];

        // Check cooldown
        const cooldownKey = `dose_${drugKey}`;
        const cooldownCheck = await db.execute({
            sql: 'SELECT * FROM cooldowns WHERE user_id = ? AND command = ?',
            args: [userId, cooldownKey]
        });
        const cooldown = cooldownCheck.rows[0] as any;

        if (cooldown) {
            const timeLeft = Number(cooldown.timestamp) + drug.cooldown - Date.now();
            if (timeLeft > 0) {
                const hours = Math.floor(timeLeft / (1000 * 60 * 60));
                const minutes = Math.ceil((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
                message.reply(`You need to wait **${hours}h ${minutes}m** before using **${drug.name}** again!`);
                return;
            }
        }

        // Check if user has the drug (copium is free)
        if (drugKey !== 'copium') {
            const drugAmount = await getInventoryItem(userId, drug.id);

            if (drugAmount < 1n) {
                message.reply(`You don't have any **${drug.name}**! Buy some from the Black Market (\`~bm\`).`);
                return;
            }

            // Consume drug
            await removeInventoryItem(userId, drug.id, 1n);
        }

        // Determine duration (for anesthesia/copium, allow custom time 30m-4h)
        let duration = drug.duration;
        if ((drugKey === 'anes' || drugKey === 'copium') && durationArg) {
            duration = Math.max(30, Math.min(240, durationArg)) * 60 * 1000;
        }

        // Refresh cooldowns
        for (const cd of drug.refreshCooldowns) {
            await db.execute({
                sql: 'DELETE FROM cooldowns WHERE user_id = ? AND command = ?',
                args: [userId, cd]
            });
        }

        // Apply drug effect
        const expiresAt = Date.now() + duration;
        await db.execute({
            sql: 'INSERT OR REPLACE INTO drug_effects (user_id, drug_type, expires_at) VALUES (?, ?, ?)',
            args: [userId, drugKey, expiresAt]
        });

        // Set dose cooldown
        await db.execute({
            sql: 'INSERT OR REPLACE INTO cooldowns (user_id, command, timestamp) VALUES (?, ?, ?)',
            args: [userId, cooldownKey, Date.now()]
        });

        // For anesthesia, also stun the user
        if (drugKey === 'anes' || drugKey === 'copium') {
            await db.execute({
                sql: 'INSERT OR REPLACE INTO stuns (user_id, expires_at, reason, issued_by) VALUES (?, ?, ?, ?)',
                args: [userId, expiresAt, 'Anesthesia', 'Self']
            });
        }

        const durationMinutes = Math.floor(duration / 60000);
        const embed = new EmbedBuilder()
            .setTitle(`💊 ${drug.name}`)
            .setDescription(`You took **${drug.name}**!\n${drug.description}\n\n**Duration**: ${durationMinutes} minutes`)
            .setColor('#9932cc');

        message.reply({ embeds: [embed] });
    },
};

export default command;
