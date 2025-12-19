import { Message, Client, EmbedBuilder } from 'discord.js';
import { blackMarketItems } from '../../data/blackMarketItems';
import { Command } from '../../handlers/commandHandler';
import { getUserColor } from '../../database/userColor';
import { resolveEmoji } from '../../utils/resolveEmoji';
import { formatBigNumber } from '../../utils/bigNumbers';

const command: Command = {
    name: 'bm',
    description: 'View the Black Market',
    aliases: ['blackmarket'],
    execute: async (message: Message, args: string[], client: Client) => {
        const items = Object.entries(blackMarketItems);

        const drugs = items.filter(([_, item]) => item.type === 'drug' && parseInt(item.id) <= 6)
            .map(([id, item]) => `[${id}] ${item.emoji} ${item.name} - ${item.description} -- Price: ${item.currency === 'cash' ? '💵' : item.currency === 'weed' ? '🌿' : '💊'} ${formatBigNumber(item.price)}`)
            .join('\n');

        const drugs2 = items.filter(([_, item]) => item.type === 'drug' && parseInt(item.id) > 6)
            .map(([id, item]) => `[${id}] ${item.emoji} ${item.name} - ${item.description} -- Price: 🌿 ${formatBigNumber(item.price)}`)
            .join('\n');

        const farming = items.filter(([_, item]) => item.type === 'farming')
            .map(([id, item]) => `[${id}] ${item.emoji} ${item.name} - ${item.description} -- Price: ${item.currency === 'weed' ? '🌿' : '💊'} ${formatBigNumber(item.price)}`)
            .join('\n');

        const counterfeit = items.filter(([_, item]) => item.type === 'counterfeit')
            .map(([id, item]) => {
                let priceStr = '';
                if (item.currency === 'complex' && item.paymentItems) {
                    priceStr = item.paymentItems.map(p => {
                        const emoji = p.id === 'ink' ? '☁️' : '📜';
                        return `${emoji} ${p.amount}`;
                    }).join(' & ');
                } else {
                    const emoji = item.currency === 'weed' ? '🌿' : item.currency === 'counterfeit_cash' ? '💵' : '💵';
                    priceStr = `${emoji} ${formatBigNumber(item.price)}`;
                }
                return `[${id}] ${item.emoji} ${item.name} - ${item.description} -- Price: ${priceStr}`;
            })
            .join('\n');

        const embed = new EmbedBuilder()
            .setTitle('Black Market')
            .setDescription('Welcome to the black market! `~exch <id> <amount>` to make a trade. Be careful though, the people here cannot be trusted...')
            .setColor('#2b2d31')
            .addFields(
                { name: 'Drugs', value: drugs || 'None' },
                { name: 'Drugs (1024 char limit :/)', value: drugs2 || 'None' },
                { name: 'Farming', value: farming || 'None' },
                { name: 'Counterfeit', value: counterfeit || 'None' }
            );

        message.reply({ embeds: [embed] });
    },
};

export default command;
