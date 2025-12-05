import { Message, Client, EmbedBuilder } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';
import { formatBigNumber, parseBigNumber } from '../../utils/bigNumbers';

const ADMIN_ID = '1331780893995565148';

const command: Command = {
    name: 'users',
    description: 'View and manage users (Admin only)',
    execute: async (message: Message, args: string[], client: Client) => {
        if (message.author.id !== ADMIN_ID) return;

        const subCommand = args[0]?.toLowerCase();

        if (!subCommand || subCommand === 'list') {
            // List users (limit 10)
            const result = await db.execute('SELECT * FROM users ORDER BY balance DESC LIMIT 10');
            const users = result.rows as any[];

            const embed = new EmbedBuilder()
                .setTitle('👥 User Database (Top 10)')
                .setColor('#2f3136');

            let description = '';
            for (const user of users) {
                const discordUser = await client.users.fetch(user.id).catch(() => null);
                const name = discordUser ? discordUser.tag : user.id;
                const bal = formatBigNumber(BigInt(user.balance || '0'));
                const vault = formatBigNumber(BigInt(user.vault || '0'));
                description += `**${name}** (` + '`' + user.id + '`' + `)\n💰 ${bal} | 🏦 ${vault} | 💊 ${user.pills}\n\n`;
            }

            embed.setDescription(description || 'No users found.');
            message.reply({ embeds: [embed] });
            return;
        }

        if (subCommand === 'view') {
            const targetId = args[1];
            if (!targetId) {
                message.reply('Usage: `~users view <id>`');
                return;
            }

            const userCheck = await db.execute({
                sql: 'SELECT * FROM users WHERE id = ?',
                args: [targetId]
            });
            const user = userCheck.rows[0] as any;
            if (!user) {
                message.reply('User not found.');
                return;
            }

            const discordUser = await client.users.fetch(targetId).catch(() => null);
            const bal = formatBigNumber(BigInt(user.balance || '0'));
            const vault = formatBigNumber(BigInt(user.vault || '0'));
            const credits = formatBigNumber(BigInt(user.credits || '0'));
            const embed = new EmbedBuilder()
                .setTitle(`👤 User: ${discordUser ? discordUser.tag : targetId}`)
                .addFields(
                    { name: 'ID', value: user.id, inline: true },
                    { name: 'Balance', value: `💵 ${bal}`, inline: true },
                    { name: 'Vault', value: `🏦 ${vault}`, inline: true },
                    { name: 'Credits', value: `🍥 ${credits}`, inline: true },
                    { name: 'Pills', value: `💊 ${user.pills}`, inline: true }
                )
                .setColor('#2f3136');

            message.reply({ embeds: [embed] });
            return;
        }

        if (subCommand === 'set') {
            // ~users set <id> <field> <value>
            const targetId = args[1];
            const field = args[2];
            const value = args[3];

            if (!targetId || !field || !value) {
                message.reply('Usage: `~users set <id> <field> <value>`\nFields: balance, vault, credits, pills');
                return;
            }

            const validFields = ['balance', 'vault', 'credits', 'pills'];
            if (!validFields.includes(field)) {
                message.reply(`Invalid field. Valid fields: ${validFields.join(', ')}`);
                return;
            }

            // For balance, vault, credits - store as string for BigInt support
            // For pills - store as number
            if (['balance', 'vault', 'credits'].includes(field)) {
                const bigValue = parseBigNumber(value) ?? 0n;
                try {
                    await db.execute({
                        sql: `UPDATE users SET ${field} = ? WHERE id = ?`,
                        args: [bigValue.toString(), targetId]
                    });
                    message.reply(`✅ Updated ${field} for user ${targetId} to ${formatBigNumber(bigValue)}.`);
                } catch (error) {
                    message.reply('Error updating user.');
                    console.error(error);
                }
            } else {
                const numValue = parseInt(value);
                if (isNaN(numValue)) {
                    message.reply('Value must be a number.');
                    return;
                }
                try {
                    await db.execute({
                        sql: `UPDATE users SET ${field} = ? WHERE id = ?`,
                        args: [numValue, targetId]
                    });
                    message.reply(`✅ Updated ${field} for user ${targetId} to ${numValue}.`);
                } catch (error) {
                    message.reply('Error updating user.');
                    console.error(error);
                }
            }
            return;
        }

        message.reply('Usage: `~users [list|view|set]`');
    },
};

export default command;
