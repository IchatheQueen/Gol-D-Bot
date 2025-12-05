import { Message, Client, EmbedBuilder } from 'discord.js';
import db from '../../database/db';
import { getUser, updateUser } from '../../database/economy';
import { getInventoryItem } from '../../database/inventory';
import { Command } from '../../handlers/commandHandler';
import { getUserColor } from '../../database/userColor';
import { formatBigNumber } from '../../utils/bigNumbers';

const command: Command = {
    name: 'interest',
    description: 'Increase your balance by 2.5X',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;

        // Check if user has Investor
        const investorAmount = await getInventoryItem(userId, 'p9');
        if (investorAmount < 1n) {
            message.reply('You need the **Investor** donator item to use this command! Check `~dshop`.');
            return;
        }

        // Check cooldown (12 hours)
        const cooldownTime = 12 * 60 * 60 * 1000;
        const cooldownCheck = await db.execute({
            sql: 'SELECT timestamp FROM cooldowns WHERE user_id = ? AND command = ?',
            args: [userId, 'interest']
        });

        if (cooldownCheck.rows.length > 0) {
            const row = cooldownCheck.rows[0] as any;
            const timeLeft = Number(row.timestamp) + cooldownTime - Date.now();
            if (timeLeft > 0) {
                const hours = Math.floor(timeLeft / (1000 * 60 * 60));
                const minutes = Math.ceil((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
                message.reply(`You can collect interest again in ${hours}h ${minutes}m.`);
                return;
            }
        }

        const user = await getUser(userId);
        // 2.5X multiplier: newBalance = balance * 2.5 = (balance * 5) / 2
        const newBalance = (user.balance * 5n) / 2n;
        const interestAmount = newBalance - user.balance;

        await updateUser(userId, { balance: newBalance });

        // Set cooldown
        await db.execute({
            sql: 'INSERT OR REPLACE INTO cooldowns (user_id, command, timestamp) VALUES (?, ?, ?)',
            args: [userId, 'interest', Date.now()]
        });

        const embed = new EmbedBuilder()
            .setDescription(`💰 You collected **2.5X interest** on your balance!\n\n**Interest earned**: 💵 ${formatBigNumber(interestAmount)}\n**New balance**: 💵 ${formatBigNumber(newBalance)}`)
            .setColor(getUserColor(userId));

        message.reply({ embeds: [embed] });
    },
};

export default command;
