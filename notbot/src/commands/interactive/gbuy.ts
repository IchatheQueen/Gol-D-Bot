import { Message, Client } from 'discord.js';
import db from '../../database/db';
import { shopItems } from '../../data/petItems';
import { getUser, updateUser } from '../../database/economy';
import { Command } from '../../handlers/commandHandler';
import { addInventoryItem } from '../../database/inventory';

const command: Command = {
    name: 'gbuy',
    description: 'Buy items from the pet shop',
    execute: async (message: Message, args: string[], client: Client) => {
        const id = args[0];
        const amount = parseInt(args[1]) || 1;

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
        const totalCost = item.price * amount;

        if (item.currency === 'cash') {
            const cost = BigInt(totalCost);
            if (user.balance < cost) {
                message.reply(`You don't have enough cash! Cost: $${totalCost.toLocaleString()}`);
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

            if ((userPills?.pills || 0) < totalCost) {
                message.reply(`You don't have enough pills! Cost: 💊 ${totalCost.toLocaleString()}`);
                return;
            }

            await db.execute({
                sql: 'UPDATE users SET pills = pills - ? WHERE id = ?',
                args: [totalCost, message.author.id]
            });
        }

        // Add item to inventory
        const itemId = item.name.toLowerCase().replace(/ /g, '_').replace(/\[.*?\]/g, '').trim();

        await addInventoryItem(message.author.id, itemId, BigInt(amount));

        message.reply(`You bought **${amount}x ${item.name}** for ${item.currency === 'cash' ? '$' : '💊 '}${totalCost.toLocaleString()}.`);
    },
};

export default command;
