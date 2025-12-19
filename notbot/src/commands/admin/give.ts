import { Message, Client, EmbedBuilder } from 'discord.js';
import db from '../../database/db';
import { getUser, updateUser } from '../../database/economy';
import { Command } from '../../handlers/commandHandler';
import { resolveTarget } from '../../utils/resolveTarget';
import { parseBigNumber, formatBigNumber, addBigNumbers } from '../../utils/bigNumbers';
import { items } from '../../data/items';

import { isAdmin } from '../../utils/adminUtils';

const command: Command = {
    name: 'give',
    description: 'Admin command to give items/currency universally',
    execute: async (message: Message, args: string[], client: Client) => {
        if (!await isAdmin(message.author.id)) {
            message.reply('You do not have permission to use this command.');
            return;
        }

        const target = await resolveTarget(message, args, client, 0);
        if (!target) {
            const helpEmbed = new EmbedBuilder()
                .setTitle('🔧 Universal Give Command')
                .setDescription(
                    'Usage: `~give <user> <type/item> [amount]`\n\n' +
                    '**Examples:**\n' +
                    '- `~give myid bal 1Q` (Give cash)\n' +
                    '- `~give myid beer 10` (Give items)\n' +
                    '- `~give myid conj` (Give Conjuror)\n' +
                    '- `~give myid 2` (Give OG Package bundle)\n' +
                    '- `~give myid credits 100` (Give credits)\n' +
                    '- `~give myid vault 1T` (Give vault money)'
                )
                .setColor('#ffcc00');
            message.reply({ embeds: [helpEmbed] });
            return;
        }

        const targetId = target.id;
        const targetName = target.username;
        const inputType = args[1]?.toLowerCase();
        const amountStr = args[2]?.replace(/,/g, '');
        const amount = parseBigNumber(amountStr || '1') || 1n;

        if (!inputType) {
            message.reply('Specify what you want to give! (e.g., balance, beer, conj)');
            return;
        }

        // 1. Check for Currency
        const currencyMap: Record<string, 'balance' | 'vault' | 'credits' | 'pills'> = {
            'bal': 'balance', 'balance': 'balance', 'cash': 'balance',
            'vault': 'vault', 'bank': 'vault',
            'cred': 'credits', 'credits': 'credits', 'dcred': 'credits',
            'pills': 'pills', 'pillz': 'pills'
        };

        if (currencyMap[inputType]) {
            const col = currencyMap[inputType];
            const user = await getUser(targetId);
            const currentVal = (user as any)[col] || 0n;
            const newVal = addBigNumbers(currentVal, amount);

            await db.execute({
                sql: `UPDATE users SET ${col} = ? WHERE id = ?`,
                args: [newVal.toString(), targetId]
            });

            const icons: Record<string, string> = { balance: '💵', vault: '🏦', credits: '💎', pills: '💊' };
            message.reply(`✅ Gave **${targetName}** ${icons[col]} **${formatBigNumber(amount)}** ${col}`);
            return;
        }

        // 2. Check for Premium Bundles (Packages)
        const bundles: Record<string, string[]> = {
            'p1': ['p7', 'p6'], // Essentials: Conjuror + Statistician
            'p2': ['p7', 'p9', 'p6'], // OG: Conjuror + Investor + Statistician
            'p3': ['p7', 'p9', 'p6', 'p8'], // No-lifer: OG + Junkie
            'p4': ['p8', 'p9', 'p10'], // Gentlemen: Junkie + Investor + Seagull
            'p5': ['p6', 'p7', 'p8', 'p9', 'p10'], // Flexer: All basic premium
        };

        if (bundles[inputType]) {
            const contents = bundles[inputType];
            for (const itemId of contents) {
                await db.execute({
                    sql: 'INSERT INTO inventory (user_id, item_id, amount) VALUES (?, ?, 1) ON CONFLICT(user_id, item_id) DO UPDATE SET amount = amount + 1',
                    args: [targetId, itemId]
                });
            }
            message.reply(`✅ Gave **${targetName}** the **${inputType.toUpperCase()} Bundle** (${contents.length} items)`);
            return;
        }

        // 3. Smart Item Lookup (ID, Name, Alises)
        const aliases: Record<string, string> = {
            'conj': 'p7', 'conjuror': 'p7',
            'stat': 'p6', 'statistician': 'p6',
            'inv': 'p9', 'investor': 'p9',
            'junkie': 'p8',
            'gull': 'p10', 'seagull': 'p10',
            'donor': 'p12', 'recruit': 'p13'
        };

        let itemId = aliases[inputType] || inputType;

        // Verify if it's a valid item in data/items.ts
        let foundItem = items[itemId];
        if (!foundItem) {
            // Search by name
            const search = Object.values(items).find(i => i.name.toLowerCase() === inputType || i.id.toLowerCase() === inputType);
            if (search) {
                foundItem = search;
                itemId = search.id;
            }
        }

        if (foundItem) {
            await db.execute({
                sql: 'INSERT INTO inventory (user_id, item_id, amount) VALUES (?, ?, ?) ON CONFLICT(user_id, item_id) DO UPDATE SET amount = amount + ?',
                args: [targetId, itemId, amount.toString(), amount.toString()]
            });
            const emoji = foundItem.emoji || '📦';
            message.reply(`✅ Gave **${targetName}** ${emoji} **${formatBigNumber(amount)}x ${foundItem.name}**`);
            return;
        }

        // 4. Fallback for Custom Commands (Special prefix maybe? Or just try?)
        // Custom command logic usually uses specific table, but here we can just fallback to unknown.
        message.reply(`❌ Could not find an item or currency named "**${inputType}**". Use \`~give\` for help.`);
    },
};

export default command;
