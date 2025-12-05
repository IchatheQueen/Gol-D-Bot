import { Message, Client, EmbedBuilder } from 'discord.js';
import { getUser, updateUser } from '../../database/economy';
import { addInventoryItem } from '../../database/inventory';
import { Command } from '../../handlers/commandHandler';
import { items } from '../../data/items';
import { getUserColor } from '../../database/userColor';
import { formatBigNumber } from '../../utils/bigNumbers';

const command: Command = {
    name: 'dbuy',
    description: 'Purchase a premium item',
    execute: async (message: Message, args: string[], client: Client) => {
        const idMap: { [key: string]: string } = {
            '1': 'p1', '2': 'p2', '3': 'p3', '4': 'p4', '5': 'p5',
            '6': 'p6', '7': 'p7', '8': 'p8', '9': 'p9', '10': 'p10',
            '11': 'p11', '12': 'p12', '13': 'p13'
        };

        const inputId = args[0];
        const itemId = idMap[inputId];

        if (!itemId) {
            message.reply('Usage: `~dbuy <id>` (e.g. `~dbuy 1`)');
            return;
        }

        const itemDef = items[itemId];
        if (!itemDef) {
            message.reply('Invalid item ID.');
            return;
        }

        const user = await getUser(message.author.id);
        const price = BigInt(itemDef.price);

        if (user.credits < price) {
            message.reply(`You need **💎 ${formatBigNumber(price)}** credits to buy **${itemDef.name}**! You have **💎 ${formatBigNumber(user.credits)}**.`);
            return;
        }

        // Deduct credits
        await updateUser(message.author.id, { credits: user.credits - price });

        // Add item to inventory
        await addInventoryItem(message.author.id, itemId, 1n);

        // Handle Package Logic
        let extraMsg = '';
        if (itemId === 'p1') { // Essentials
            await addInventoryItem(message.author.id, 'p7', 1n); // Conjuror
            await addInventoryItem(message.author.id, 'p6', 1n); // Statistician
            extraMsg = '\nUnpacked: **Conjuror**, **Statistician**';
        } else if (itemId === 'p2') { // OG
            await addInventoryItem(message.author.id, 'p7', 1n);
            await addInventoryItem(message.author.id, 'p9', 1n); // Investor
            await addInventoryItem(message.author.id, 'p6', 1n);
            extraMsg = '\nUnpacked: **Conjuror**, **Investor**, **Statistician**';
        } else if (itemId === 'p3') {
            await addInventoryItem(message.author.id, 'p6', 1n); await addInventoryItem(message.author.id, 'p7', 1n); await addInventoryItem(message.author.id, 'p9', 1n); await addInventoryItem(message.author.id, 'p8', 1n);
            extraMsg = '\nYou received: **Statistician**, **Conjuror**, **Investor**, **Junkie**';
        } else if (itemId === 'p4') {
            await addInventoryItem(message.author.id, 'p8', 1n); await addInventoryItem(message.author.id, 'p9', 1n); await addInventoryItem(message.author.id, 'p10', 1n);
            extraMsg = '\nYou received: **Junkie**, **Investor**, **Seagull**';
        } else if (itemId === 'p5') {
            await addInventoryItem(message.author.id, 'p6', 1n); await addInventoryItem(message.author.id, 'p7', 1n); await addInventoryItem(message.author.id, 'p8', 1n);
            await addInventoryItem(message.author.id, 'p9', 1n); await addInventoryItem(message.author.id, 'p10', 1n); await addInventoryItem(message.author.id, 'p11', 1n);
            extraMsg = '\nYou received: **Statistician**, **Conjuror**, **Junkie**, **Investor**, **Seagull**';
        }

        const embed = new EmbedBuilder()
            .setTitle('💎 Purchase Successful')
            .setDescription(`You bought **${itemDef.name}** for **💎 ${formatBigNumber(price)}**!${extraMsg}`)
            .setColor(getUserColor(message.author.id));

        message.reply({ embeds: [embed] });
    },
};

export default command;
