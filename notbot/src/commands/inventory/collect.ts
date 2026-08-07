import { Message, Client, EmbedBuilder } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';
import { getInventoryItem, addInventoryItem } from '../../database/inventory';
import { getUserColor } from '../../database/userColor';
import { formatBigNumber } from '../../utils/bigNumbers';

// "Cooldown of 12 hours per collect" — the shop copy calls it "daily", but the
// command's own help page is authoritative.
const COLLECT_COOLDOWN_MS = 12 * 60 * 60 * 1000;

/**
 * Kidnapped types you can collect from. `held` is the inventory item counting
 * how many of that type you have kidnapped; `briefcase` is what they produce.
 */
const KIDNAP_TYPES: Record<string, { held: string; briefcase: string; label: string; emoji: string }> = {
    ender: {
        held: 'endermomandnates',
        briefcase: 'ender_briefcase',
        label: 'EnderMomandNates',
        emoji: '😂',
    },
};

const command: Command = {
    name: 'collect',
    description: 'Collect briefcases from your pool of kidnapped',
    usage: '~collect',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;
        const typeArg = args[0]?.toLowerCase();

        // Bare `~collect` is the documented usage and collects from every
        // mercenary type; a type may still be given to collect just that one.
        if (typeArg && !KIDNAP_TYPES[typeArg]) {
            message.reply(`Invalid type! Available: ${Object.keys(KIDNAP_TYPES).join(', ')}`);
            return;
        }

        const kind = KIDNAP_TYPES[typeArg ?? 'ender'];
        const held = await getInventoryItem(userId, kind.held);

        if (held < 1n) {
            message.reply(`You haven't kidnapped any ${kind.label}!`);
            return;
        }

        const cooldownKey = `collect_${typeArg ?? 'ender'}`;
        const cooldownCheck = await db.execute({
            sql: 'SELECT timestamp FROM cooldowns WHERE user_id = ? AND command = ?',
            args: [userId, cooldownKey]
        });
        const cooldownRow = cooldownCheck.rows[0] as any;

        if (cooldownRow) {
            const timeLeft = Number(cooldownRow.timestamp) + COLLECT_COOLDOWN_MS - Date.now();
            if (timeLeft > 0) {
                const hours = Math.floor(timeLeft / (1000 * 60 * 60));
                const minutes = Math.ceil((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
                message.reply(`Your ${kind.label} are still working! Come back in **${hours}h ${minutes}m**.`);
                return;
            }
        }

        // One briefcase per kidnapped victim, per day.
        await addInventoryItem(userId, kind.briefcase, held);

        await db.execute({
            sql: 'INSERT OR REPLACE INTO cooldowns (user_id, command, timestamp) VALUES (?, ?, ?)',
            args: [userId, cooldownKey, Date.now()]
        });

        const embed = new EmbedBuilder()
            .setDescription(
                `${message.author.username} (@${message.author.username}) collected ` +
                `💼 ${formatBigNumber(held)} from their ${kind.emoji} ${formatBigNumber(held)} ${kind.label}\n` +
                `└ \`~briefcases\` to view them`
            )
            .setColor(getUserColor(userId));

        message.reply({ embeds: [embed] });
    },
};

export default command;
