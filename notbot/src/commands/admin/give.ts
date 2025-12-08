import { Message, Client, EmbedBuilder } from 'discord.js';
import db from '../../database/db';
import { getUser, updateUser } from '../../database/economy';
import { Command } from '../../handlers/commandHandler';
import { resolveTarget } from '../../utils/resolveTarget';
import { parseBigNumber, formatBigNumber, addBigNumbers } from '../../utils/bigNumbers';

// Admin IDs
const ADMIN_IDS = ['1331780893995565148'];

const command: Command = {
    name: 'give',
    description: 'Admin command to give items/currency',
    execute: async (message: Message, args: string[], client: Client) => {
        if (!ADMIN_IDS.includes(message.author.id)) {
            message.reply('You do not have permission to use this command.');
            return;
        }

        const type = args[0]?.toLowerCase();

        if (!type) {
            const embed = new EmbedBuilder()
                .setTitle('🔧 Admin Give Command')
                .setDescription(
                    '`~give bal <@user|ID|myid> <amount>` - Give balance\n' +
                    '`~give drug <@user|ID|myid> <drug> <amount>` - Give drugs\n' +
                    '`~give ditem <@user|ID|myid> <item_id>` - Give donator item\n' +
                    '`~give weapon <@user|ID|myid> <weapon>` - Give weapon\n' +
                    '`~give item <@user|ID|myid> <item_id> <amount>` - Give any item\n' +
                    '`~give credits <@user|ID|myid> <amount>` - Give credits\n' +
                    '`~give vault <@user|ID|myid> <amount>` - Give vault money\n' +
                    '`~give ccmd <@user|ID|myid> <command> [access|co|owner]` - Give custom command access'
                )
                .setColor('#ff0000');
            message.reply({ embeds: [embed] });
            return;
        }

        const target = await resolveTarget(message, args, client, 1);

        if (!target) {
            message.reply('Please specify a user (@mention, ID, or myid)!');
            return;
        }

        const targetId = target.id;
        const targetName = target.username;

        switch (type) {
            case 'bal':
            case 'balance': {
                const amountStr = args[2]?.replace(/,/g, '');
                const amount = parseBigNumber(amountStr || '0');
                if (!amount || amount <= 0n) {
                    message.reply('Invalid amount!');
                    return;
                }
                const user = await getUser(targetId);
                const newBalance = addBigNumbers(user.balance, amount);
                await db.execute({
                    sql: 'UPDATE users SET balance = ? WHERE id = ?',
                    args: [newBalance, targetId]
                });
                message.reply(`✅ Gave **${targetName}** 💵 ${formatBigNumber(amount)}`);
                break;
            }

            case 'drug': {
                const drugName = args[2]?.toLowerCase();
                const amountStr = args[3]?.replace(/,/g, '');
                const amount = parseBigNumber(amountStr || '1') || 1n;
                const validDrugs = ['weed', 'opioid', 'steroids', 'cocaine', 'anesthetics', 'lsd'];

                if (!validDrugs.includes(drugName)) {
                    message.reply(`Invalid drug! Valid: ${validDrugs.join(', ')}`);
                    return;
                }

                await db.execute({
                    sql: 'INSERT INTO inventory (user_id, item_id, amount) VALUES (?, ?, ?) ON CONFLICT(user_id, item_id) DO UPDATE SET amount = amount + ?',
                    args: [targetId, drugName, amount.toString(), amount.toString()]
                });
                message.reply(`✅ Gave **${targetName}** ${formatBigNumber(amount)}x ${drugName}`);
                break;
            }

            case 'ditem': {
                const itemId = args[2]?.toLowerCase();
                if (!itemId || !itemId.startsWith('p')) {
                    message.reply('Invalid donator item! Use p1, p2, p3... p13');
                    return;
                }

                await db.execute({
                    sql: 'INSERT INTO inventory (user_id, item_id, amount) VALUES (?, ?, 1) ON CONFLICT(user_id, item_id) DO UPDATE SET amount = amount + 1',
                    args: [targetId, itemId]
                });
                message.reply(`✅ Gave **${targetName}** donator item **${itemId}**`);
                break;
            }

            case 'weapon': {
                const weaponMap: Record<string, string> = {
                    'crossbow': '7',
                    'rifle': '9',
                    'speaker': '11',
                    'flamethrower': '12',
                };
                const weaponName = args[2]?.toLowerCase();
                const weaponId = weaponMap[weaponName];

                if (!weaponId) {
                    message.reply(`Invalid weapon! Valid: ${Object.keys(weaponMap).join(', ')}`);
                    return;
                }

                await db.execute({
                    sql: 'INSERT INTO inventory (user_id, item_id, amount) VALUES (?, ?, 1) ON CONFLICT(user_id, item_id) DO UPDATE SET amount = amount + 1',
                    args: [targetId, weaponId]
                });
                message.reply(`✅ Gave **${targetName}** a **${weaponName}**`);
                break;
            }

            case 'item': {
                const itemId = args[2];
                const amountStr = args[3]?.replace(/,/g, '');
                const amount = parseBigNumber(amountStr || '1') || 1n;

                if (!itemId) {
                    message.reply('Specify an item ID!');
                    return;
                }

                await db.execute({
                    sql: 'INSERT INTO inventory (user_id, item_id, amount) VALUES (?, ?, ?) ON CONFLICT(user_id, item_id) DO UPDATE SET amount = amount + ?',
                    args: [targetId, itemId, amount.toString(), amount.toString()]
                });
                message.reply(`✅ Gave **${targetName}** ${formatBigNumber(amount)}x item **${itemId}**`);
                break;
            }

            case 'credits':
            case 'dcred': {
                const amountStr = args[2]?.replace(/,/g, '');
                const amount = parseBigNumber(amountStr || '0');
                if (!amount || amount <= 0n) {
                    message.reply('Invalid amount!');
                    return;
                }
                await getUser(targetId);
                const user = await getUser(targetId);
                const newCredits = addBigNumbers(user.credits || 0, amount);
                await db.execute({
                    sql: 'UPDATE users SET credits = ? WHERE id = ?',
                    args: [newCredits, targetId]
                });
                message.reply(`✅ Gave **${targetName}** 💎 ${formatBigNumber(amount)} credits`);
                break;
            }

            case 'vault': {
                const amountStr = args[2]?.replace(/,/g, '');
                const amount = parseBigNumber(amountStr || '0');
                if (!amount || amount <= 0n) {
                    message.reply('Invalid amount!');
                    return;
                }
                const user = await getUser(targetId);
                const newVault = addBigNumbers(user.vault, amount);
                await db.execute({
                    sql: 'UPDATE users SET vault = ? WHERE id = ?',
                    args: [newVault, targetId]
                });
                message.reply(`✅ Gave **${targetName}** 🏦 ${formatBigNumber(amount)} to vault`);
                break;
            }

            case 'ccmd': {
                const commandName = args[2]?.toLowerCase();
                const level = args[3]?.toLowerCase() === 'owner' ? 'owner' : (args[3]?.toLowerCase() === 'co' ? 'co_owner' : 'access');

                if (!commandName) {
                    message.reply('Specify a command name!');
                    return;
                }

                // If level is 'owner', update ownership table
                if (level === 'owner') {
                    await db.execute({
                        sql: `INSERT INTO custom_command_ownership (command_name, owner_id)
                              VALUES (?, ?)
                              ON CONFLICT(command_name) DO UPDATE SET owner_id = ?`,
                        args: [commandName, targetId, targetId]
                    });

                    // Also ensure they have access in access table
                    await db.execute({
                        sql: `INSERT INTO custom_command_access (command_name, user_id, access_type)
                              VALUES (?, ?, 'owner')
                              ON CONFLICT(command_name, user_id) DO UPDATE SET access_type = 'owner'`,
                        args: [commandName, targetId]
                    });

                    message.reply(`✅ Transferred OWNERSHIP of custom command **${commandName}** to **${targetName}**`);
                } else {
                    // Update access table
                    await db.execute({
                        sql: `INSERT INTO custom_command_access (command_name, user_id, access_type)
                              VALUES (?, ?, ?)
                              ON CONFLICT(command_name, user_id) DO UPDATE SET access_type = ?`,
                        args: [commandName, targetId, level, level]
                    });

                    message.reply(`✅ Gave **${targetName}** **${level.toUpperCase()}** access to **${commandName}**`);
                }
                break;
            }

            default:
                message.reply('Unknown type! Use: bal, drug, ditem, weapon, item, credits, vault');
        }
    },
};

export default command;
