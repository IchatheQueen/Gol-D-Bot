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
    aliases: ['obliterate'],
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
        if (targetId === OWNER_ID && userId !== OWNER_ID) {
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
            'pistol': '<:pistol:1445995386031308890>',
            'rifle': '<:rifle:1445995242317942874>',
            'crossbow': '🏹',
            'speaker': '📢',
            'flamethrower': '<:flamethrower:1446143428290416670>',
            'laser': '🕹️', // Screenshot shows joystick/controller? Using generic for now or from screenshot if I can see it better. Looks like 🕹️
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
            // Check for 'obliterate' alias
            const commandName = message.content.split(' ')[0].slice(1).toLowerCase();
            const isObliterate = commandName === 'obliterate';

            // Rifle: Loops 6-10 times, each loop steals and disintegrates
            const loops = Math.floor(Math.random() * (10 - 6 + 1)) + 6;
            let currentBalance = targetData.balance;

            if (isObliterate) {
                // Berserk / Obliterate Theme
                // 1. Initial Eclipse Message
                const eclipseEmbed = new EmbedBuilder()
                    .setDescription(`<a:behelit:1447492829051555932> ${attackerTag} has summoned the power of the eclipse and activated the Crimson Behelit. Transporting to ${targetTag} landscape filled with demons`)
                    .setImage('https://media1.tenor.com/m/F8J8-R8M5eIAAAAd/berserk-behelit.gif') // Behelit Face
                    .setColor('#880000');
                await message.reply({ embeds: [eclipseEmbed] });
                await new Promise(resolve => setTimeout(resolve, 2000));

                for (let i = 0; i < loops; i++) {
                    if (currentBalance <= 0n) break;
                    await new Promise(resolve => setTimeout(resolve, 1500)); // Slower pacing for drama

                    const stealPct = BigInt(Math.floor(Math.random() * 13) + 6);
                    const destroyPct = BigInt(Math.floor(Math.random() * 46) + 9);
                    const loopStolen = (currentBalance * stealPct) / 100n;
                    const loopDestroyed = (currentBalance * destroyPct) / 100n;

                    totalStolen += loopStolen;
                    totalDamage += loopDestroyed;
                    currentBalance -= (loopStolen + loopDestroyed);

                    // 2. First Hit: Mark of Sacrifice
                    if (i === 0) {
                        const markEmbed = new EmbedBuilder()
                            .setDescription(`The demons then mark ${targetTag} with the symbol of sacrifice. Causing them to run away in fear, dropping 💵 ${formatBigNumber(loopStolen)}...`)
                            .setImage('https://media1.tenor.com/m/pA_zH9yPhs0AAAAd/berserk-brand-of-sacrifice.gif') // Brand
                            .setColor('#AA0000');
                        await (message.channel as any).send({ embeds: [markEmbed] });
                    }
                    // 3. Middle Hits: Chase
                    else if (i < loops - 1) {
                        const chaseEmbed = new EmbedBuilder()
                            .setDescription(`While running, ${targetTag}, was grabbed by demons causing them to drop 💵 ${formatBigNumber(loopStolen)}...`)
                            .setThumbnail('https://media1.tenor.com/m/t1hQyVqZ4JAAAAAd/berserk-skeleton.gif') // Small demon gif
                            .setColor('#660000');
                        await (message.channel as any).send({ embeds: [chaseEmbed] });
                    }
                    // 4. Final Hit: Eaten
                    else {
                        const deathEmbed = new EmbedBuilder()
                            .setDescription(`After running for so long, ${targetTag} was finally caught and eaten by a demon, dropping a total of 💵 ${formatBigNumber(totalStolen)} from their limp severed hand.`)
                            .setImage('https://media1.tenor.com/m/nIs2qkhZ-wQAAAAd/berserk-monster.gif') // Demon eating
                            .setColor('#440000');
                        await (message.channel as any).send({ embeds: [deathEmbed] });
                    }
                }
                resultMessage = ''; // Handled
            } else {
                // Standard Rifle Logic
                await (message.channel as any).send(`${attackerTag} has opened fire on ${targetTag} using their ${weaponEmoji}...`);

                for (let i = 0; i < loops; i++) {
                    if (currentBalance <= 0n) break;
                    await new Promise(resolve => setTimeout(resolve, 800));

                    const stealPct = BigInt(Math.floor(Math.random() * 13) + 6);
                    const destroyPct = BigInt(Math.floor(Math.random() * 46) + 9);

                    const loopStolen = (currentBalance * stealPct) / 100n;
                    const loopDestroyed = (currentBalance * destroyPct) / 100n;

                    totalStolen += loopStolen;
                    totalDamage += loopDestroyed;
                    currentBalance -= (loopStolen + loopDestroyed);

                    await (message.channel as any).send(`💵 ${formatBigNumber(loopStolen)} has been moved to ${attackerTag}'s account and 💵 ${formatBigNumber(loopDestroyed)} disintegrated`);
                }
                resultMessage = '';
            }
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
            // Flamethrower: Burns crops + Stuns target + Stuns attacker
            const crops = ['102', '103', '104', '105'];
            const cropEmojis: Record<string, string> = { '102': '🌱', '103': '🌹', '104': '🌾', '105': '🌿' };

            // Send initial message
            await (message.channel as any).send(`${attackerTag} has opened fire on ${targetTag} using their ${weaponEmoji}...`);

            // Burn Crops
            for (const cropId of crops) {
                const amount = await getInventoryItem(targetId, cropId);
                if (amount > 0n) {
                    // Burn 50-100%
                    const percent = BigInt(Math.floor(Math.random() * 51) + 50);
                    const burnAmount = (amount * percent) / 100n;

                    if (burnAmount > 0n) {
                        await removeInventoryItem(targetId, cropId, burnAmount);
                        const emoji = cropEmojis[cropId];
                        await (message.channel as any).send(`${emoji} ${formatBigNumber(burnAmount)} from ${targetTag}'s farm have gone up in 🔥`);
                    }
                } else {
                    const emoji = cropEmojis[cropId];
                    await (message.channel as any).send(`${emoji} 0 from ${targetTag}'s farm have gone up in 🔥`);
                }
            }

            // Stun Target (3m)
            const stunDuration = 3 * 60 * 1000;
            const expiresAt = Date.now() + stunDuration;
            await db.execute({
                sql: 'INSERT OR REPLACE INTO stuns (user_id, expires_at, reason, issued_by) VALUES (?, ?, ?, ?)',
                args: [targetId, expiresAt, 'Flamethrower burn', userId]
            });

            await (message.channel as any).send(`${targetTag} has succumbed to the heat of the flames and gone unconscious for 3 minutes`);

            // Stun Attacker (Self-Hit per item description)
            // Description: "knocks you unconscious as well in the process"
            // Wait, screenshot didn't explicitly show "attacker unconscious" message, but item description says so.
            // I will implement it but maybe silently or with a small message if not in screenshot?
            // "caroo.q has switched..." -> "opened fire..."
            // I'll add it.
            const selfStun = Date.now() + stunDuration;
            await db.execute({
                sql: 'INSERT OR REPLACE INTO stuns (user_id, expires_at, reason, issued_by) VALUES (?, ?, ?, ?)',
                args: [userId, selfStun, 'Flamethrower recoil', userId]
            });

            resultMessage = ''; // Already handled messages
        }
        else if (weaponId === 'laser') {
            // Laser: Vaporizes Beer from target, Consumes Pills + Battery from attacker
            // Screenshot: "vaporized 🍺 [amount], consuming 💊 105 and 🔋 37"

            // Check Attacker Inventory for Ammo (Pills + Battery)
            const pillsNeeded = 105n;
            const batteriesNeeded = 37n;

            const userPills = await getInventoryItem(userId, 'cat_pill');
            const userBatteries = await getInventoryItem(userId, 'battery');

            if (userPills < pillsNeeded || userBatteries < batteriesNeeded) {
                message.reply(`You need ${pillsNeeded} 💊 and ${batteriesNeeded} 🔋 to fire the laser!`);
                return;
            }

            // Consume Ammo
            await removeInventoryItem(userId, 'cat_pill', pillsNeeded);
            await removeInventoryItem(userId, 'battery', batteriesNeeded);

            // Destroy Target Beer
            const targetBeer = await getInventoryItem(targetId, 'beer');
            let destroyedBeer = 0n;

            if (targetBeer > 0n) {
                // "Vaporized" implies destruction. Screenshot shows huge number (probably all or %?).
                // I will burn 50-100% of beer
                const percent = BigInt(Math.floor(Math.random() * 51) + 50);
                destroyedBeer = (targetBeer * percent) / 100n;

                if (destroyedBeer > 0n) {
                    await removeInventoryItem(targetId, 'beer', destroyedBeer);
                }
            }

            resultMessage = `${attackerTag}'s ${weaponEmoji} has unleashed a focused beam of light at ${targetTag} and vaporized 🍺 ${formatBigNumber(destroyedBeer)}, consuming 💊 ${pillsNeeded} and 🔋 ${batteriesNeeded} in the process`;
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

        if (resultMessage) {
            const embed = new EmbedBuilder()
                .setDescription(resultMessage)
                .setColor('#ff0000');

            message.reply({ embeds: [embed] });
        }

        // DM the target about the attack
        if (targetId !== userId) {
            await sendCombatDM(client, targetId, resultMessage);
        }
    },
};

export default command;
