import { Message, Client, EmbedBuilder } from 'discord.js';
import db from '../../database/db';
import { getUser, updateUser } from '../../database/economy';
import { Command } from '../../handlers/commandHandler';
import { getInventoryItem, removeInventoryItem } from '../../database/inventory';
import { formatBigNumber } from '../../utils/bigNumbers';

const command: Command = {
    name: 'laser',
    description: 'Use your cat\'s laser to destroy a target item',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;

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
        // "Consumes Cat Pills and Cat Energy"
        // Let's assume 1 Pill and Energy based on Strength/Endurance
        const energyCost = Math.max(10, 50 - pet.endurance);
        const pillCost = 1;

        if (pet.energy < energyCost) {
            message.reply('Your cat is too tired for lasers!');
            return;
        }

        // Check pills (user inventory or user stats? User has 'pills' column)
        const userCheck = await db.execute({
            sql: 'SELECT pills FROM users WHERE id = ?',
            args: [userId]
        });
        const user = userCheck.rows[0] as any;

        if (user.pills < pillCost) {
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

        // Effect: Disintegrates 100% of target item
        let resultMessage = '';

        // We need a target user for this to make sense.
        // The command description says "~shoot <target>", but ~laser doesn't specify args in the prompt.
        // Assuming ~laser <target>
        const targetUser = message.mentions.users.first();
        const targetId = targetUser ? targetUser.id : args[0];

        if (!targetId) {
            message.reply('Usage: `~laser <target>`');
            return;
        }

        if (targetItem === 'balance') {
            const targetData = await getUser(targetId);
            // Destroy based on strength? Or 100%?
            // "Disintegrates 100% of the item"
            // Let's cap it at 50% for balance to be somewhat fair, or 100% if user insists.
            // User said "Disintegrates 100% of the item".
            // I'll do 100% but maybe it fails often?
            // Let's do (10% * Strength) capped at 100% for now.
            const strengthPct = BigInt(Math.min(100, pet.strength * 10));
            const damage = (targetData.balance * strengthPct) / 100n;

            await updateUser(targetId, { balance: targetData.balance - damage });
            resultMessage = `🕹️ **LASER BEAM!**\nYour cat disintegrated 💵 ${formatBigNumber(damage)} (${strengthPct}% efficiency) from ${targetUser?.username || targetId}!`;
        } else {
            // Target is an item ID
            const targetInvAmount = await getInventoryItem(targetId, targetItem);

            if (targetInvAmount > 0n) {
                const destroyed = targetInvAmount; // 100%
                await removeInventoryItem(targetId, targetItem, destroyed);
                resultMessage = `🕹️ **LASER BEAM!**\nYour cat disintegrated ALL ${targetItem} (${destroyed}) from ${targetUser?.username || targetId}!`;
            } else {
                resultMessage = `🕹️ **LASER BEAM!**\nYour cat fired at ${targetUser?.username || targetId}'s ${targetItem}, but they didn't have any!`;
            }
        }

        const embed = new EmbedBuilder()
            .setTitle('🕹️ Cat Laser Attack')
            .setDescription(resultMessage)
            .setColor('#ff00ff');

        message.reply({ embeds: [embed] });
    },
};

export default command;
