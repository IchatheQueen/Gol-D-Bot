import { Message, Client, EmbedBuilder } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';
import { getInventoryItem } from '../../database/inventory';
import { getUserColor } from '../../database/userColor';

// Stock types
const stockTypes: Record<number, { name: string; emoji: string }> = {
    1: { name: 'Casino', emoji: '🎰' },
};

const command: Command = {
    name: 'shares',
    description: 'View your stock shares',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;

        // Check if user has Statistician
        const statAmount = await getInventoryItem(userId, 'p6');
        if (statAmount < 1n) {
            message.reply('You need the **Statistician** donator item to use this command! Check `~dshop`.');
            return;
        }

        // Get all stock holdings
        const stocksResult = await db.execute({
            sql: 'SELECT stock_type, shares FROM stocks WHERE user_id = ?',
            args: [userId]
        });
        const stocks = stocksResult.rows as any[];

        let stockList = '';
        for (const stock of stocks) {
            const stockDef = stockTypes[stock.stock_type];
            if (stockDef) {
                const sharesNum = BigInt(stock.shares);
                if (sharesNum > 0n) {
                    // Calculate total value (shares * some multiplier, simplified)
                    const totalValue = sharesNum * 90n; // Example multiplier

                    // Format with digit count for very large numbers
                    const sharesStr = sharesNum.toString();
                    const valueStr = totalValue.toString();

                    let sharesDisplay = sharesStr.length > 20
                        ? `${sharesStr.slice(0, 20)}... (${sharesStr.length} digits)`
                        : sharesNum.toLocaleString();
                    let valueDisplay = valueStr.length > 20
                        ? `${valueStr.slice(0, 20)}... (${valueStr.length} digits)`
                        : totalValue.toLocaleString();

                    stockList += `**[${stock.stock_type}] ${stockDef.name}**\n`;
                    stockList += `Shares | ${sharesDisplay}\n`;
                    stockList += `Total Value | 💵 ${valueDisplay}\n\n`;
                }
            }
        }

        if (!stockList) {
            stockList = 'You don\'t own any shares.\n\nUse `~stocks` to view available stocks and `~purchase <amount> <type>` to buy.';
        }

        const embed = new EmbedBuilder()
            .setTitle(`${message.author.username} (@${message.author.username})'s Stock Account`)
            .setDescription(`\`~sell <amount> 1\` to sell Casino shares\n\n${stockList}`)
            .setColor(getUserColor(userId));

        message.reply({ embeds: [embed] });
    },
};

export default command;
