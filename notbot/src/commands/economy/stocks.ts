import { Message, Client, EmbedBuilder } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';
import { getInventoryItem } from '../../database/inventory';
import { getUserColor } from '../../database/userColor';

// Stock types with current prices
const stockTypes: Record<number, { name: string; emoji: string; price: bigint }> = {
    1: { name: 'Casino', emoji: '🎰', price: 90n },
};

const command: Command = {
    name: 'stocks',
    description: 'View available stocks',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;

        // Check if user has Statistician
        const statAmount = await getInventoryItem(userId, 'p6');
        if (statAmount < 1n) {
            message.reply('You need the **Statistician** donator item to use this command! Check `~dshop`.');
            return;
        }

        let stockList = '';
        for (const [id, stock] of Object.entries(stockTypes)) {
            stockList += `**[${id}] ${stock.emoji} ${stock.name}**\n`;
            stockList += `Price per share: 💵 ${stock.price.toLocaleString()}\n\n`;
        }

        const embed = new EmbedBuilder()
            .setTitle('📈 Stock Market')
            .setDescription(`\`~purchase <amount> <type>\` to buy shares\n\`~shares\` to view your holdings\n\n${stockList}`)
            .setColor(getUserColor(userId));

        message.reply({ embeds: [embed] });
    },
};

export default command;
