import { Message, Client, EmbedBuilder } from 'discord.js';
import { shopItems } from '../../data/petItems';
import { Command } from '../../handlers/commandHandler';
import { formatBigNumber } from '../../utils/bigNumbers';
import { getUserColor } from '../../database/userColor';

const command: Command = {
    // SlotBot calls this ~gshop, a holdover from when the pet was a goose.
    // Cat bot, so: ~cshop. Old names kept as aliases so nobody's muscle
    // memory breaks.
    name: 'cshop',
    description: 'Shop for cat related items',
    aliases: ['petshop', 'catshop'],
    execute: async (message: Message, args: string[], client: Client) => {
        const embed = new EmbedBuilder()
            .setTitle('🐈 | Cat Shop')
            .setDescription('`~cbuy <id> <amount>` to buy from here')
            .setColor(getUserColor(message.author.id));

        let refreshments = '';
        let toys = '';

        Object.values(shopItems).forEach(item => {
            const price = item.currency === 'cash' ? `💵 ${formatBigNumber(item.price)}` : `💊 ${formatBigNumber(item.price)}`;
            const line = `[ID: **${item.id}**] ${item.name} - Price: ${price}\n└ ${item.description}\n`;

            if (item.id.startsWith('1')) {
                refreshments += line;
            } else {
                toys += line;
            }
        });

        embed.addFields(
            { name: 'Refreshments', value: refreshments || 'None' },
            { name: 'cat Toys', value: toys || 'None' }
        );

        message.reply({ embeds: [embed] });
    },
};

export default command;
