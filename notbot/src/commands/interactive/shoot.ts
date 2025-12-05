import { Message, Client, EmbedBuilder } from 'discord.js';
import db from '../../database/db';
import { getUser, updateUser } from '../../database/economy';
import { Command } from '../../handlers/commandHandler';
import { getInventoryItem, removeInventoryItem } from '../../database/inventory';
import { sendCombatDM } from '../../utils/combatNotify';
import { formatBigNumber } from '../../utils/bigNumbers';
import { resolveEmoji } from '../../utils/resolveEmoji';

const command: Command = {
    name: 'shoot',
    description: 'Shoot a target with your selected weapon',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;
        const user = await getUser(userId);
        const targetUser = message.mentions.users.first();
        const targetId = targetUser ? targetUser.id : args[0];

        if (!targetId) {
            message.reply('Usage: `~shoot <target>`');
            return;
        }

        // Owner Protection
        const OWNER_ID = '1331780893995565148';
        if (targetId === OWNER_ID) {
            const stunDuration = 5 * 60 * 1000;
            const expiresAt = Date.now() + stunDuration;

            await db.execute({
                sql: 'INSERT OR REPLACE INTO stuns (user_id, expires_at, reason, issued_by) VALUES (?, ?, ?, ?)',
                args: [userId, expiresAt, 'Shot the Owner', 'System']
            });

            message.reply(`👑 <@${OWNER_ID}> catches your bullets, and flings them back at you in full force, stunning you for 5 Minutes. Don't shoot them!`);
            return;
        }

        // Bot Protection (Burns Money - 10%)
        if (targetUser?.bot) {
            const burnAmount = user.balance / 10n;

            if (burnAmount > 0n) {
                await updateUser(userId, { balance: user.balance - burnAmount });
                message.reply(`🤖 **Security Protocol Engaged**\nYou shot a bot! It reflects the damage, burning **💵 ${formatBigNumber(burnAmount)}** from your balance!`);
            } else {
                message.reply(`🤖 **Security Protocol Engaged**\nYou shot a bot! It tries to burn your money, but you're broke!`);
            }
            return;
        }

        // Check if attacker is stunned
        const stunCheck = await db.execute({
            sql: 'SELECT * FROM stuns WHERE user_id = ? AND expires_at > ?',
            args: [userId, Date.now()]
        });
        if (stunCheck.rows.length > 0) {
            message.reply('You are stunned and cannot attack!');
            return;
        }

        const targetData = await getUser(targetId);
        const weaponId = user.selected_weapon || 'pistol';

        // Weapon emojis
        const weaponEmojis: Record<string, string> = {
            'pistol': '🔫',
            'rifle': '<:rifle:1445995242317942874>',
            'crossbow': '🏹',
            'speaker': '📢',
            'flamethrower': '🔥',
        };
        const weaponEmoji = weaponEmojis[weaponId] || '🔫';

        // Check Weapon Cooldown
        const cooldownKey = `shoot_${weaponId}`;
        const cooldownCheck = await db.execute({
            sql: 'SELECT * FROM cooldowns WHERE user_id = ? AND command = ?',
            args: [userId, cooldownKey]
        });
        const cooldown = cooldownCheck.rows[0] as any;

        let cooldownTime = 0;
        switch (weaponId) {
            case 'pistol': cooldownTime = 3 * 60 * 60 * 1000; break;
            case 'rifle': cooldownTime = 3 * 60 * 60 * 1000; break;
            case 'crossbow': cooldownTime = 3 * 60 * 60 * 1000; break;
            case 'speaker': cooldownTime = 6 * 60 * 60 * 1000; break;
            case 'flamethrower': cooldownTime = 6 * 60 * 60 * 1000; break;
        }

        if (cooldown) {
            const timeLeft = Number(cooldown.timestamp) + cooldownTime - Date.now();
            if (timeLeft > 0) {
                const hours = Math.floor(timeLeft / (1000 * 60 * 60));
                const minutes = Math.ceil((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
                message.reply(`Your weapon is cooling down! Wait ${hours}h ${minutes}m.`);
                return;
            }
        }

        // Determine Ammo
        let ammoId = '';
        const ammoItemIds: Record<string, string> = {
            'pistol': '6',      // Pistol Bullet
            'rifle': '10',      // Rifle Bullet
            'crossbow': '8',    // Arrow
            'flamethrower': '13', // Propane
        };
        ammoId = ammoItemIds[weaponId] || '';

        // Check Ammo Inventory
        if (ammoId) {
            const ammoAmount = await getInventoryItem(userId, ammoId);

            if (ammoAmount < 1n) {
                message.reply(`You need ammo to use your weapon! Buy from the Pub (\`~pub\`).`);
                return;
            }

            // Consume Ammo
            await removeInventoryItem(userId, ammoId, 1n);
        }

        // Get target display name
        const attackerTag = `${message.author.username}#${message.author.discriminator}`;
        const targetTag = targetUser ? `${targetUser.username}#${targetUser.discriminator}` : targetId;

        let resultMessage = '';
        let totalStolen = 0n;
        let totalDamage = 0n;

        if (weaponId === 'pistol') {
            // Pistol: Steals 6-18%, Disintegrates 9-54%
            const stealPct = BigInt(Math.floor(Math.random() * 13) + 6); // 6-18
            const destroyPct = BigInt(Math.floor(Math.random() * 46) + 9); // 9-54

            totalStolen = (targetData.balance * stealPct) / 100n;
            totalDamage = (targetData.balance * destroyPct) / 100n;

            resultMessage = `${attackerTag} has shot ${targetTag} with their ${weaponEmoji}, stealing 💵 ${formatBigNumber(totalStolen)} and disintegrating another 💵 ${formatBigNumber(totalDamage)}`;
        }
        else if (weaponId === 'rifle') {
            // Rifle: Loops 6-10 times, each loop steals and disintegrates
            const loops = Math.floor(Math.random() * (10 - 6 + 1)) + 6;
            let currentBalance = targetData.balance;
            const loopResults: string[] = [];

            loopResults.push(`${attackerTag} has opened fire on ${targetTag} using their ${weaponEmoji}...`);

            for (let i = 0; i < loops; i++) {
                if (currentBalance <= 0n) break;

                const stealPct = BigInt(Math.floor(Math.random() * 13) + 6); // 6-18
                const destroyPct = BigInt(Math.floor(Math.random() * 46) + 9); // 9-54

                const loopStolen = (currentBalance * stealPct) / 100n;
                const loopDestroyed = (currentBalance * destroyPct) / 100n;

                totalStolen += loopStolen;
                totalDamage += loopDestroyed;
                currentBalance -= (loopStolen + loopDestroyed);

                loopResults.push(`💵 ${formatBigNumber(loopStolen)} has been moved to ${attackerTag}'s account and 💵 ${formatBigNumber(loopDestroyed)} disintegrated`);
            }

            resultMessage = loopResults.join('\n');
        }
        else if (weaponId === 'crossbow') {
            // Crossbow: Steals fixed amount based on attacker's digit count
            const attackerDigits = user.balance.toString().length;
            const stealDigits = Math.floor(attackerDigits / 2);
            const stealAmount = BigInt(Math.pow(10, stealDigits));

            totalStolen = stealAmount < targetData.balance ? stealAmount : targetData.balance;

            resultMessage = `${attackerTag} has shot ${targetTag} with their ${weaponEmoji} and stolen 💵 ${formatBigNumber(totalStolen)}`;
        }
        else if (weaponId === 'speaker') {
            // Speaker: Stun 2m-4m
            const stunDuration = (Math.floor(Math.random() * (4 - 2 + 1)) + 2) * 60 * 1000;
            const expiresAt = Date.now() + stunDuration;
            await db.execute({
                sql: 'INSERT OR REPLACE INTO stuns (user_id, expires_at, reason, issued_by) VALUES (?, ?, ?, ?)',
                args: [targetId, expiresAt, 'Speaker blast', userId]
            });

            resultMessage = `${attackerTag} has blasted ${targetTag} with their ${weaponEmoji}, stunning them for ${stunDuration / 60000} minutes!`;
        }
        else if (weaponId === 'flamethrower') {
            // Flamethrower: Stun 3m-5m
            const stunDuration = (Math.floor(Math.random() * (5 - 3 + 1)) + 3) * 60 * 1000;
            const expiresAt = Date.now() + stunDuration;
            await db.execute({
                sql: 'INSERT OR REPLACE INTO stuns (user_id, expires_at, reason, issued_by) VALUES (?, ?, ?, ?)',
                args: [targetId, expiresAt, 'Flamethrower burn', userId]
            });

            resultMessage = `${attackerTag} has scorched ${targetTag} with their ${weaponEmoji}, stunning them for ${stunDuration / 60000} minutes!`;
        }

        // Apply Balance Changes
        if (totalStolen > 0n || totalDamage > 0n) {
            // Cap at target balance
            const totalTaken = totalStolen + totalDamage;
            if (totalTaken > targetData.balance) {
                // Scale proportionally
                totalStolen = (targetData.balance * totalStolen) / totalTaken;
                totalDamage = targetData.balance - totalStolen;
            }

            await updateUser(targetId, { balance: targetData.balance - totalStolen - totalDamage });
            await updateUser(userId, { balance: user.balance + totalStolen });
        }

        // Set Cooldown
        await db.execute({
            sql: 'INSERT OR REPLACE INTO cooldowns (user_id, command, timestamp) VALUES (?, ?, ?)',
            args: [userId, cooldownKey, Date.now()]
        });

        const embed = new EmbedBuilder()
            .setDescription(resultMessage)
            .setColor('#ff0000');

        message.reply({ embeds: [embed] });

        // DM the target about the attack
        if (targetId !== userId) {
            await sendCombatDM(client, targetId, resultMessage);
        }
    },
};

export default command;
