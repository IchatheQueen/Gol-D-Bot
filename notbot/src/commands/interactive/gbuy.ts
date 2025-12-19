import { Message, Client, EmbedBuilder } from 'discord.js';
import db from '../../database/db';
import { shopItems } from '../../data/petItems';
import { items } from '../../data/items';
import { parseBigNumber, formatBigNumber } from '../../utils/bigNumbers';
import { addInventoryItem } from '../../database/inventory';
import { getUser, updateUser } from '../../database/economy';
import { Command } from '../../handlers/commandHandler';

const command: Command = {
    name: 'gbuy',
    description: 'Buy items from the pet shop',
    execute: async (message: Message, args: string[], client: Client) => {
        const id = args[0];
        const amount = parseBigNumber(args[1] || '1') || 1n;

        if (!id) {
            message.reply('Usage: ~gbuy <id> <amount>');
            return;
        }

        const item = shopItems[id];
        if (!item) {
            message.reply('Invalid item ID.');
            return;
        }

        const user = await getUser(message.author.id);
        const totalCost = BigInt(item.price) * amount;

        if (item.currency === 'cash') {
            const cost = totalCost;
            if (user.balance < cost) {
                message.reply(`You don't have enough cash! Cost: $${formatBigNumber(cost)}`);
                return;
            }
            await updateUser(message.author.id, { balance: user.balance - cost });
        } else {
            // Check pills (assuming pills are stored in users table as per migration)
            // Temporary manual check until economy.ts is updated
            const pillsCheck = await db.execute({
                sql: 'SELECT pills FROM users WHERE id = ?',
                args: [message.author.id]
            });
            const userPills = pillsCheck.rows[0] as any;

            if (BigInt(userPills?.pills || 0) < totalCost) {
                message.reply(`You don't have enough pills! Cost: 💊 ${formatBigNumber(totalCost)}`);
                return;
            }

            await db.execute({
                sql: 'UPDATE users SET pills = pills - ? WHERE id = ?',
                args: [totalCost.toString(), message.author.id]
            });
        }

        // Add item to inventory
        const itemId = item.id; // Use item.id as defined in petItems.ts

        await addInventoryItem(message.author.id, itemId, BigInt(amount));

        const itemEmoji = items[itemId]?.emoji || '📦';
        const displayName = message.guild?.members.cache.get(message.author.id)?.displayName || message.author.username;
        const embed = new EmbedBuilder()
            .setDescription(`${displayName} (@${message.author.username}) has successfully purchased ${itemEmoji} ${amount}`)
            .setColor(0x2b2d31);

        message.reply({ embeds: [embed] });
    },
};

export default command;
