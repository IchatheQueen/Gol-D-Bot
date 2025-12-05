import { Message, Client, EmbedBuilder } from 'discord.js';
import { blackMarketItems } from '../../data/blackMarketItems';
import { Command } from '../../handlers/commandHandler';
import { getUserColor } from '../../database/userColor';
import { resolveEmoji } from '../../utils/resolveEmoji';

const command: Command = {
    name: 'bm',
    description: 'View the Black Market',
    aliases: ['blackmarket'],
    execute: async (message: Message, args: string[], client: Client) => {
        const embed = new EmbedBuilder()
            .setTitle('🕵️ | GoldBot Black Market')
            .setDescription('`~exch <id> <amount>` to make a trade\n⚠️ Be careful! This shop may scam you!\nHint: The id is the number in brackets next to the item!')
            .setColor(getUserColor(message.author.id));

        let drugs = '';
        let farming = '';
        let counterfeit = '';

        Object.values(blackMarketItems).forEach(item => {
            const price = item.currency === 'cash' ? `💵 ${item.price.toLocaleString()}` : `🌿 ${item.price.toLocaleString()}`;
            const emoji = resolveEmoji(client, item.emoji);
            const line = `[ID: **${item.id}**] ${emoji} ${item.name} - Price: ${price}\n└ ${item.description}\n`;

            if (item.type === 'drug') drugs += line;
            else if (item.type === 'farming') farming += line;
            else if (item.type === 'counterfeit') counterfeit += line;
        });

        embed.addFields(
            { name: 'Drugs', value: drugs || 'None' },
            { name: 'Farming', value: farming || 'None' },
            { name: 'Counterfeit', value: counterfeit || 'None' }
        );

        message.reply({ embeds: [embed] });
    },
};

export default command;
