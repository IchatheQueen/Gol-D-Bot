import { Message, Client, EmbedBuilder } from 'discord.js';
import { getUser } from '../../database/economy';
import { getInventoryItem } from '../../database/inventory';
import { Command } from '../../handlers/commandHandler';
import { getUserColor } from '../../database/userColor';
import { formatBigNumber } from '../../utils/bigNumbers';

const command: Command = {
    name: 'calc',
    description: 'Calculate expressions with your balance',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;

        // Statistician unlocks the balance variables. Plain arithmetic stays
        // available to everyone — this command used to be shadowed by a basic
        // calculator of the same name, so non-donators had ~calc regardless.
        const statAmount = await getInventoryItem(userId, 'p6');
        const hasStatistician = statAmount >= 1n;

        const expression = args.join(' ');

        if (!expression) {
            const usage = hasStatistician
                ? 'Usage: `~calc <expression>`\nExample: `~calc allmoney / 10000`\n\nVariables: `allmoney` (total balance), `bal` (balance), `vault` (vault)'
                : 'Usage: `~calc <expression>`\nExample: `~calc 2 + 2`\n\nUnlock the `allmoney`, `bal` and `vault` variables with the **Statistician** donator item — check `~dshop`.';
            message.reply(usage);
            return;
        }

        if (!hasStatistician && /allmoney|bal|vault/i.test(expression)) {
            message.reply('You need the **Statistician** donator item to use balance variables in `~calc`! Check `~dshop`.');
            return;
        }

        const user = await getUser(userId);
        const hasDecimal = /[.]/.test(expression);
        let calcExpr = expression;
        let result: any;

        try {
            if (hasDecimal) {
                // Number mode (lossy for large numbers)
                calcExpr = calcExpr
                    .replace(/allmoney/gi, String(Number(user.balance + user.vault)))
                    .replace(/bal/gi, String(Number(user.balance)))
                    .replace(/vault/gi, String(Number(user.vault)));

                if (!/^[\d\s+\-*/().]+$/.test(calcExpr)) {
                    message.reply('Invalid expression! Only numbers and operators (+, -, *, /, parentheses) are allowed.');
                    return;
                }

                result = Function(`"use strict"; return Math.floor(${calcExpr})`)();
            } else {
                // BigInt mode
                calcExpr = calcExpr
                    .replace(/allmoney/gi, `${user.balance + user.vault}n`)
                    .replace(/bal/gi, `${user.balance}n`)
                    .replace(/vault/gi, `${user.vault}n`);

                // Replace standalone integers with BigInt literals
                calcExpr = calcExpr.replace(/\b\d+\b/g, (match) => `${match}n`);

                if (!/^[\d\s+\-*/().n]+$/.test(calcExpr)) {
                    message.reply('Invalid expression! Only numbers and operators (+, -, *, /, parentheses) are allowed.');
                    return;
                }

                result = Function(`"use strict"; return (${calcExpr})`)();
            }

            // Check result validity
            if (typeof result === 'number' && !isFinite(result)) {
                message.reply('Invalid calculation result (Infinity or NaN).');
                return;
            }

            const displayResult = typeof result === 'bigint' ? formatBigNumber(result) : result.toLocaleString();

            const embed = new EmbedBuilder()
                .setTitle('🧮 Calculator')
                .setDescription(`**Expression**: \`${expression}\`\n**Result**: ${displayResult}`)
                .setColor(getUserColor(userId));

            message.reply({ embeds: [embed] });
        } catch (error) {
            message.reply('Error evaluating expression! Check your syntax.');
        }
    },
};

export default command;
