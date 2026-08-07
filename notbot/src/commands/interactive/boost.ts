import { Message, Client, EmbedBuilder } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';
import { isImmuneToAttacks } from '../../database/drugEffects';
import { getUserColor } from '../../database/userColor';
import { sendCombatDM } from '../../utils/combatNotify';
import { resolveTarget } from '../../utils/resolveTarget';

// Tunable: how long the target is stunned, and how often a booster may do it.
const STUN_MINUTES = 10;
const COOLDOWN_MS = 3 * 60 * 60 * 1000; // 3 hours, matching ~hex

/**
 * Boosting the server is the entitlement, so accept either a live Discord
 * boost or the stored is_premium flag — the latter is what GuildMemberUpdate
 * writes when someone starts boosting, and what ~givepremium grants manually.
 */
async function canBoost(message: Message, userId: string): Promise<boolean> {
    try {
        const member = message.guild ? await message.guild.members.fetch(userId) : null;
        if (member?.premiumSince) return true;
    } catch {
        // Fall through to the stored flag.
    }

    const result = await db.execute({
        sql: 'SELECT is_premium FROM users WHERE id = ?',
        args: [userId]
    });
    const row = result.rows[0] as any;
    return Boolean(row && Number(row.is_premium) === 1);
}

const command: Command = {
    name: 'boost',
    description: 'Stun a user — a perk for boosting the server',
    usage: '~boost <target>',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;

        if (!(await canBoost(message, userId))) {
            message.reply('You need to be a **Server Booster** to use this command! Boost the server to unlock `~boost`.');
            return;
        }

        const targetResolved = await resolveTarget(message, args, client);

        if (!targetResolved) {
            message.reply('Your attack missed because you didn\'t mention the user!');
            return;
        }

        let targetUser: any;
        try {
            targetUser = await client.users.fetch(targetResolved.id);
        } catch {
            targetUser = { id: targetResolved.id, username: targetResolved.username, bot: false, toString: () => `<@${targetResolved.id}>` };
        }

        if (targetUser.bot) {
            message.reply('You cannot boost bots!');
            return;
        }

        if (targetUser.id === userId) {
            message.reply('You cannot boost yourself!');
            return;
        }

        // Check cooldown
        const cooldownCheck = await db.execute({
            sql: 'SELECT timestamp FROM cooldowns WHERE user_id = ? AND command = ?',
            args: [userId, 'boost']
        });
        const cooldownRow = cooldownCheck.rows[0] as any;

        if (cooldownRow) {
            const timeLeft = Number(cooldownRow.timestamp) + COOLDOWN_MS - Date.now();
            if (timeLeft > 0) {
                const hours = Math.floor(timeLeft / (1000 * 60 * 60));
                const minutes = Math.ceil((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
                message.reply(`You can boost again in ${hours}h ${minutes}m.`);
                return;
            }
        }

        // Check if attacker is stunned
        const stunCheck = await db.execute({
            sql: 'SELECT * FROM stuns WHERE user_id = ? AND expires_at > ?',
            args: [userId, Date.now()]
        });
        if (stunCheck.rows.length > 0) {
            message.reply('You are stunned and cannot boost!');
            return;
        }

        if (await isImmuneToAttacks(targetUser.id, 'boost')) {
            message.reply(`<@${targetUser.id}> is immune to attacks right now!`);
            return;
        }

        const expiresAt = Date.now() + STUN_MINUTES * 60 * 1000;

        await db.execute({
            sql: 'INSERT OR REPLACE INTO stuns (user_id, expires_at, reason, issued_by) VALUES (?, ?, ?, ?)',
            args: [targetUser.id, expiresAt, 'Boosted', userId]
        });

        await db.execute({
            sql: 'INSERT OR REPLACE INTO cooldowns (user_id, command, timestamp) VALUES (?, ?, ?)',
            args: [userId, 'boost', Date.now()]
        });

        const embed = new EmbedBuilder()
            .setDescription(`💎 ${message.author} has boosted ${targetUser} into next week`)
            .setColor(getUserColor(userId));

        await message.reply({ embeds: [embed] });

        await (message.channel as any).send(`${targetUser} is seeing stars for ${STUN_MINUTES} minutes 💫`);

        await sendCombatDM(client, targetUser.id, `You were boosted by ${message.author.username} and stunned for ${STUN_MINUTES}m!`);
    },
};

export default command;
