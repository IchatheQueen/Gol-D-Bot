import { Message, Client, EmbedBuilder } from 'discord.js';
import { items } from '../../data/items';
import { getUser, updateUser } from '../../database/economy';
import { addInventoryItem } from '../../database/inventory';
import { Command } from '../../handlers/commandHandler';
import { getUserColor } from '../../database/userColor';
import { parseBigNumber, formatBigNumber } from '../../utils/bigNumbers';

const command: Command = {
    name: 'shop',
    description: 'View the shop',
    aliases: ['store'],
    execute: async (message: Message, args: string[], client: Client) => {
        const action = args[0];
        const itemId = args[1]?.toLowerCase();

        if (!action) {
            const embed = new EmbedBuilder()
                .setTitle('Shop')
                .setColor(getUserColor(message.author.id))
            let description = 'Use `~shop buy <item_id>` to purchase.\n\n';

            Object.values(items).forEach(item => {
                const priceDisplay = typeof item.price === 'string'
                    ? formatBigNumber(parseBigNumber(item.price) || 0n)
                    : item.price.toLocaleString();
                description += `**${item.name}** ($${priceDisplay})\n${item.description}\n\n`;
            });

            embed.setDescription(description);

            message.reply({ embeds: [embed] });
            return;
        }

        if (action === 'buy') {
            if (!itemId) {
                message.reply('Usage: ~shop buy <item_id>');
                return;
            }

            const itemDef = items[itemId];
            if (!itemDef) {
                message.reply('That item does not exist.');
                return;
            }

            const user = await getUser(message.author.id);
            const price = parseBigNumber(itemDef.price.toString()) || 0n;

            if (user.balance < price) {
                message.reply('You cannot afford this item.');
                return;
            }

            await updateUser(message.author.id, { balance: user.balance - price });

            await addInventoryItem(message.author.id, itemId, 1n);

            message.reply(`You bought **${itemDef.name}** for $${formatBigNumber(price)}.`);
        }
    },
};

export default command;
