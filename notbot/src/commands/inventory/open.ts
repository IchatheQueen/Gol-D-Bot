import { Message, Client } from 'discord.js';
import { getInventoryItem, removeInventoryItem } from '../../database/inventory';
import { getUser, updateUser } from '../../database/economy';
import { Command } from '../../handlers/commandHandler';
import { formatBigNumber } from '../../utils/bigNumbers';

const briefcases = ['employee', 'richkid', 'oldlady', 'nitro', 'ender'];

const command: Command = {
    name: 'open',
    description: 'Open a briefcase',
    execute: async (message: Message, args: string[], client: Client) => {
        const type = args[0]?.toLowerCase();

        if (!type) {
            message.reply(`The types of briefcases are ${briefcases.map(b => `\`${b}\``).join(', ')}`);
            return;
        }

        if (type === 'all') {
            // Logic to open all (simplified: just say feature coming soon or loop)
            message.reply('Opening all briefcases is not supported yet.');
            return;
        }

        if (!briefcases.includes(type)) {
            message.reply('Invalid briefcase type.');
            return;
        }

        const itemId = `${type}_briefcase`;
        const amount = await getInventoryItem(message.author.id, itemId);

        if (amount <= 0n) {
            message.reply(`You don't have any **${type}** briefcases.`);
            return;
        }

        // Loot logic - money based on briefcase type
        const moneyRanges: Record<string, [number, number]> = {
            'employee': [1000, 10000],
            'richkid': [50000, 500000],
            'oldlady': [100000, 1000000],
            'nitro': [500000, 5000000],
            'ender': [1000000, 10000000],
        };
        const [min, max] = moneyRanges[type] || [1000, 10000];
        const money = BigInt(Math.floor(Math.random() * (max - min)) + min);
        const user = await getUser(message.author.id);
        await updateUser(message.author.id, { balance: user.balance + money });

        await removeInventoryItem(message.author.id, itemId, 1n);

        message.reply(`You opened the **${type}** briefcase and found **💵 ${formatBigNumber(money)}**!`);
    },
};

export default command;
