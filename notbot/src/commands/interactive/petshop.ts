import { Message, Client, EmbedBuilder } from 'discord.js';
import { shopItems } from '../../data/petItems';
import { Command } from '../../handlers/commandHandler';

const command: Command = {
    name: 'petshop',
    description: 'Shop for cat related items',
    aliases: ['catshop'],
    execute: async (message: Message, args: string[], client: Client) => {
        const embed = new EmbedBuilder()
            .setTitle('🐈 | Cat Shop')
            .setDescription('`~gbuy <id> <amount>` to buy from here')
            .setColor('#2f3136');

        let refreshments = '';
        let toys = '';

        Object.values(shopItems).forEach(item => {
            const price = item.currency === 'cash' ? `💵 ${item.price.toLocaleString()}` : `💊 ${item.price.toLocaleString()}`;
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
