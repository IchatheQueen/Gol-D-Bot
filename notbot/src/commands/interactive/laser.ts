import { Message, Client, EmbedBuilder } from 'discord.js';
import db from '../../database/db';
import { getUser, updateUser } from '../../database/economy';
import { Command } from '../../handlers/commandHandler';
import { getInventoryItem, removeInventoryItem } from '../../database/inventory';
import { formatBigNumber } from '../../utils/bigNumbers';
import { resolveTarget } from '../../utils/resolveTarget';
import { isImmuneToAttacks } from '../../database/drugEffects';

const command: Command = {
    name: 'laser',
    description: 'Use your cat\'s laser to destroy a target item',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;

        // Resolve Target FIRST before deducting costs
        const targetResolved = await resolveTarget(message, args, client, 0);
        if (!targetResolved) {
            message.reply('Usage: `~laser <target>`');
            return;
        }

        const targetId = targetResolved.id;

        if (targetId === userId) {
            message.reply('You cannot laser yourself!');
            return;
        }

        const targetUser = await client.users.fetch(targetId).catch(() => null);
        if (targetUser?.bot) {
            message.reply('You cannot laser bots!');
            return;
        }

        if (await isImmuneToAttacks(targetId, 'laser')) {
            message.reply(`??? <@${targetId}> is immune to attacks right now!`);
            return;
        }

        // Get pet
        const petCheck = await db.execute({
            sql: 'SELECT * FROM pets WHERE user_id = ?',
            args: [userId]
        });
        const pet = petCheck.rows[0] as any;

        if (!pet) {
            message.reply('You don\'t have a cat!');
            return;
        }

        // Check target item
        const targetItem = pet.target_item || 'balance';

        // Cost: Energy and Pills
        const energyCost = Math.max(10, 50 - pet.endurance);
        const pillCost = 1;

        if (pet.energy < energyCost) {
            message.reply('Your cat is too tired for lasers!');
            return;
        }

        // Check pills
        const userCheck = await db.execute({
            sql: 'SELECT pills FROM users WHERE id = ?',
            args: [userId]
        });
        const user = userCheck.rows[0] as any;

        if (!user || user.pills < pillCost) {
            message.reply('You need pills to use the laser!');
            return;
        }

        // Consume costs
        await db.execute({
            sql: 'UPDATE pets SET energy = energy - ? WHERE user_id = ?',
            args: [energyCost, userId]
        });
        await db.execute({
            sql: 'UPDATE users SET pills = pills - ? WHERE id = ?',
            args: [pillCost, userId]
        });

        // Effect: Disintegrates item or balance
        let resultMessage = '';
        const targetName = targetUser ? targetUser.username : targetId;

        if (targetItem === 'balance' || targetItem === 'bal') {
            const targetData = await getUser(targetId);
            const strengthPct = BigInt(Math.min(100, pet.strength * 10));
            const damage = (targetData.balance * strengthPct) / 100n;

            await updateUser(targetId, { balance: targetData.balance - damage });
            resultMessage = `??? **LASER BEAM!**\nYour cat disintegrated ?? ${formatBigNumber(damage)} (${strengthPct}% efficiency) from ${targetName}!`;
        } else {
            const targetInvAmount = await getInventoryItem(targetId, targetItem);

            if (targetInvAmount > 0n) {
                const destroyed = targetInvAmount;
                await removeInventoryItem(targetId, targetItem, destroyed);
                resultMessage = `??? **LASER BEAM!**\nYour cat disintegrated ALL ${targetItem} (${destroyed}) from ${targetName}!`;
            } else {
                resultMessage = `??? **LASER BEAM!**\nYour cat fired at ${targetName}'s ${targetItem}, but they didn't have any!`;
            }
        }

        const embed = new EmbedBuilder()
            .setTitle('??? Cat Laser Attack')
            .setDescription(resultMessage)
            .setColor('#ff00ff');

        message.reply({ embeds: [embed] });
    },
};

export default command;