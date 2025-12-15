import { Message, Client, EmbedBuilder } from 'discord.js';
import db from '../../database/db';
import { getUser, updateUser } from '../../database/economy';
import { Command } from '../../handlers/commandHandler';
import { getInventoryItem } from '../../database/inventory';
import { getUserColor } from '../../database/userColor';
import { sendCombatDM } from '../../utils/combatNotify';
import { formatBigNumber } from '../../utils/bigNumbers';
import { resolveTarget } from '../../utils/resolveTarget';

const command: Command = {
    name: 'hex',
    description: 'Hex a user to steal money and stun them',
    aliases: ['haunt'],
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;
        const targetResolved = await resolveTarget(message, args, client);

        // Check if user has Conjuror
        const conjurorAmount = await getInventoryItem(userId, 'p7');
        if (conjurorAmount < 1n) {
            message.reply('You need the **Conjuror** donator item to use this command! Check `~dshop`.');
            return;
        }

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
            message.reply('You cannot hex bots!');
            return;
        }

        // Check cooldown (3 hours)
        const cooldownTime = 3 * 60 * 60 * 1000;
        const cooldownCheck = await db.execute({
            sql: 'SELECT timestamp FROM cooldowns WHERE user_id = ? AND command = ?',
            args: [userId, 'hex']
        });
        const cooldownRow = cooldownCheck.rows[0] as any;

        if (cooldownRow) {
            const timeLeft = Number(cooldownRow.timestamp) + cooldownTime - Date.now();
            if (timeLeft > 0) {
                const hours = Math.floor(timeLeft / (1000 * 60 * 60));
                const minutes = Math.ceil((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
                message.reply(`You can hex again in ${hours}h ${minutes}m.`);
                return;
            }
        }

        // Check if attacker is stunned
        const stunCheck = await db.execute({
            sql: 'SELECT * FROM stuns WHERE user_id = ? AND expires_at > ?',
            args: [userId, Date.now()]
        });
        if (stunCheck.rows.length > 0) {
            message.reply('You are stunned and cannot hex!');
            return;
        }

        const targetData = await getUser(targetUser.id);
        const user = await getUser(userId);

        // Steal 1-3% of target's balance using BigInt
        const stealPct = BigInt(Math.floor(Math.random() * 3) + 1); // 1-3
        const stolen = (targetData.balance * stealPct) / 100n;

        // Stun for 10 minutes (implied by screenshot)
        const stunMinutes = 10;
        const stunDuration = stunMinutes * 60 * 1000;
        const expiresAt = Date.now() + stunDuration;

        // Apply stun
        await db.execute({
            sql: 'INSERT OR REPLACE INTO stuns (user_id, expires_at, reason, issued_by) VALUES (?, ?, ?, ?)',
            args: [targetUser.id, expiresAt, 'Hexed', userId]
        });

        // Transfer money
        if (stolen > 0n) {
            await updateUser(targetUser.id, { balance: targetData.balance - stolen });
            await updateUser(userId, { balance: user.balance + stolen });
        }

        // Set cooldown
        await db.execute({
            sql: 'INSERT OR REPLACE INTO cooldowns (user_id, command, timestamp) VALUES (?, ?, ?)',
            args: [userId, 'hex', Date.now()]
        });

        const embed = new EmbedBuilder()
            .setDescription(`👻 ${message.author} has haunted ${targetUser} causing them to have a heart attack and drop 💵 ${formatBigNumber(stolen)}`)
            .setColor(getUserColor(userId));

        await message.reply({ embeds: [embed] });

        // Follow up message
        await message.channel.send(`${targetUser} remains on life support for ${stunMinutes} minutes 🪦`);

        // DM the target
        await sendCombatDM(client, targetUser.id, `You were haunted by ${message.author.username} and put on life support for ${stunMinutes}m!`);
    },
};

export default command;
