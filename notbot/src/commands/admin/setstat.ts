import { Message, Client, EmbedBuilder } from 'discord.js';
import db from '../../database/db';
import { getUser, updateUser } from '../../database/economy';
import { Command } from '../../handlers/commandHandler';
import { parseBigNumber, formatBigNumber } from '../../utils/bigNumbers';

// Admin IDs
import { isAdmin } from '../../utils/adminUtils';

const command: Command = {
    name: 'setstat',
    description: 'Admin command to set user stats',
    execute: async (message: Message, args: string[], client: Client) => {
        if (!await isAdmin(message.author.id)) {
            message.reply('You do not have permission to use this command.');
            return;
        }

        const category = args[0]?.toLowerCase();
        const targetUser = message.mentions.users.first();

        if (!category) {
            const embed = new EmbedBuilder()
                .setTitle('🔧 Admin Set Stat Command')
                .setDescription(
                    '**User Stats:**\n' +
                    '`~setstat bal <@user> <amount>` - Set balance\n' +
                    '`~setstat vault <@user> <amount>` - Set vault\n' +
                    '`~setstat credits <@user> <amount>` - Set credits\n\n' +
                    '**Cat Stats:**\n' +
                    '`~setstat cat <@user> health <amount>` - Set cat health\n' +
                    '`~setstat cat <@user> hunger <amount>` - Set cat hunger\n' +
                    '`~setstat cat <@user> thirst <amount>` - Set cat thirst\n' +
                    '`~setstat cat <@user> energy <amount>` - Set cat energy\n' +
                    '`~setstat cat <@user> happiness <amount>` - Set cat happiness\n' +
                    '`~setstat cat <@user> level <amount>` - Set cat level\n' +
                    '`~setstat cat <@user> strength <amount>` - Set cat strength\n' +
                    '`~setstat cat <@user> agility <amount>` - Set cat agility\n' +
                    '`~setstat cat <@user> intellect <amount>` - Set cat intellect\n' +
                    '`~setstat cat <@user> endurance <amount>` - Set cat endurance\n' +
                    '`~setstat cat <@user> name <name>` - Set cat name'
                )
                .setColor('#ff0000');
            message.reply({ embeds: [embed] });
            return;
        }

        if (!targetUser) {
            message.reply('Please mention a user!');
            return;
        }

        const targetId = targetUser.id;

        switch (category) {
            case 'bal':
            case 'balance': {
                const amount = parseBigNumber(args[2]?.replace(/,/g, '') || '0') ?? 0n;
                await getUser(targetId);
                await updateUser(targetId, { balance: amount });
                message.reply(`✅ Set **${targetUser.username}**'s balance to 💵 ${formatBigNumber(amount)}`);
                break;
            }

            case 'vault': {
                const amount = parseBigNumber(args[2]?.replace(/,/g, '') || '0') ?? 0n;
                await getUser(targetId);
                await updateUser(targetId, { vault: amount });
                message.reply(`✅ Set **${targetUser.username}**'s vault to 🏦 ${formatBigNumber(amount)}`);
                break;
            }

            case 'credits':
            case 'dcred': {
                const amount = parseInt(args[2]?.replace(/,/g, '')) || 0;
                await getUser(targetId);
                await db.execute({
                    sql: 'UPDATE users SET credits = ? WHERE id = ?',
                    args: [amount, targetId]
                });
                message.reply(`✅ Set **${targetUser.username}**'s credits to 💎 ${amount.toLocaleString()}`);
                break;
            }

            case 'cat':
            case 'pet': {
                const stat = args[2]?.toLowerCase();
                const value = args[3];

                if (!stat || !value) {
                    message.reply('Usage: `~setstat cat <@user> <stat> <value>`');
                    return;
                }

                // Check if pet exists
                const petCheck = await db.execute({
                    sql: 'SELECT * FROM pets WHERE user_id = ?',
                    args: [targetId]
                });
                const pet = petCheck.rows[0];
                if (!pet) {
                    message.reply(`${targetUser.username} doesn't have a cat!`);
                    return;
                }

                const validStats = ['health', 'max_health', 'hunger', 'thirst', 'energy', 'happiness', 'level', 'experience', 'credits', 'strength', 'agility', 'intellect', 'endurance', 'metabolism', 'protection', 'name'];

                if (!validStats.includes(stat)) {
                    message.reply(`Invalid stat! Valid: ${validStats.join(', ')}`);
                    return;
                }

                if (stat === 'name') {
                    await db.execute({
                        sql: `UPDATE pets SET name = ? WHERE user_id = ?`,
                        args: [value, targetId]
                    });
                    message.reply(`✅ Set **${targetUser.username}**'s cat name to **${value}**`);
                } else {
                    const numValue = parseInt(value.replace(/,/g, '')) || 0;
                    await db.execute({
                        sql: `UPDATE pets SET ${stat} = ? WHERE user_id = ?`,
                        args: [numValue, targetId]
                    });
                    message.reply(`✅ Set **${targetUser.username}**'s cat ${stat} to **${numValue.toLocaleString()}**`);
                }
                break;
            }

            default:
                message.reply('Unknown category! Use: bal, vault, credits, cat');
        }
    },
};

export default command;
