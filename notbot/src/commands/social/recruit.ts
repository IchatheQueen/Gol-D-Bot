import { Message, Client, EmbedBuilder } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';
import { resolveTarget } from '../../utils/resolveTarget';

const command: Command = {
    name: 'recruit',
    description: 'Manage your recruit list (alts)',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;
        const subCommand = args[0]?.toLowerCase();

        if (subCommand === 'list') {
            const recruits = await db.execute({
                sql: 'SELECT * FROM recruits WHERE owner_id = ? ORDER BY created_at ASC',
                args: [userId]
            });

            const embed = new EmbedBuilder()
                .setTitle(`@${message.author.username}'s Recruit List [${recruits.rows.length} / 7]`) // Limit 7 hardcoded for now
                .setDescription('Get **+3** more slots for your recruit limit and much more with 🪙 **Gold**\n(`~patreon`).\n\n')
                .setColor('#2f3136');

            if (recruits.rows.length === 0) {
                embed.setDescription(embed.data.description + 'No recruits found.');
            } else {
                let list = '';
                for (const row of recruits.rows as any[]) {
                    // Resolve username if possible, or just ID
                    // We might not have them cached.
                    let userTag = `<@${row.recruit_id}>`;
                    try {
                        const user = await client.users.fetch(row.recruit_id);
                        userTag = `@${user.username}`;
                    } catch (e) { }

                    list += `• \`${row.keyword}\` ${userTag}\n`;
                }
                embed.setDescription(embed.data.description + list);
            }

            message.reply({ embeds: [embed] });
            return;
        }

        if (subCommand === 'rename') {
            const oldKeyword = args[1];
            const newKeyword = args[2];

            if (!oldKeyword || !newKeyword) {
                message.reply('Usage: `~recruit rename <keyword> <new_keyword>`');
                return;
            }

            const result = await db.execute({
                sql: 'UPDATE recruits SET keyword = ? WHERE owner_id = ? AND keyword = ?',
                args: [newKeyword, userId, oldKeyword]
            });

            if (result.rowsAffected === 0) {
                message.reply(`Recruit with keyword \`${oldKeyword}\` not found.`);
            } else {
                // Get the user ID for the message
                const rec = await db.execute({
                    sql: 'SELECT recruit_id FROM recruits WHERE owner_id = ? AND keyword = ?',
                    args: [userId, newKeyword]
                });
                let userTag = '';
                if (rec.rows.length > 0) {
                    try {
                        const u = await client.users.fetch((rec.rows[0] as any).recruit_id);
                        userTag = `(@${u.username})`;
                    } catch { }
                }

                message.reply(`Successfully renamed alt \`${oldKeyword}\` ${userTag} to \`${newKeyword}\``);
            }
            return;
        }

        if (subCommand === 'remove') {
            const keyword = args[1];
            if (!keyword) {
                message.reply('Usage: `~recruit remove <keyword>`');
                return;
            }

            const result = await db.execute({
                sql: 'DELETE FROM recruits WHERE owner_id = ? AND keyword = ?',
                args: [userId, keyword]
            });

            if (result.rowsAffected === 0) {
                message.reply(`Recruit with keyword \`${keyword}\` not found.`);
            } else {
                message.reply(`Successfully removed recruit \`${keyword}\`.`);
            }
            return;
        }

        // Add Logic: ~recruit <alt> <keyword>
        // Check if args[0] is user resolvable and args[1] is keyword
        const targetResolved = await resolveTarget(message, args, client, 0);
        const targetId = targetResolved ? targetResolved.id : null;
        const keyword = args[1];

        if (targetId && keyword) {
            // Check self
            if (targetId === userId) {
                message.reply('You cannot recruit yourself.');
                return;
            }

            // Check limit (7)
            const countCheck = await db.execute({
                sql: 'SELECT COUNT(*) as count FROM recruits WHERE owner_id = ?',
                args: [userId]
            });
            if ((countCheck.rows[0] as any).count >= 7) {
                message.reply('You have reached the recruiting limit (7). Support via `~patreon` for more slots!');
                return;
            }

            // Check if already recruited

            // Check if keyword taken
            const keywordCheck = await db.execute({
                sql: 'SELECT * FROM recruits WHERE owner_id = ? AND keyword = ?',
                args: [userId, keyword]
            });
            if (keywordCheck.rows.length > 0) {
                message.reply(`You already have a recruit with keyword \`${keyword}\`.`);
                return;
            }

            // Check if user allows recruit requests
            const targetSettingsCheck = await db.execute({
                sql: 'SELECT recruit_requests FROM user_settings WHERE user_id = ?',
                args: [targetId]
            });

            // Default to 1 (allowed) if no settings row, but settings creates row on default. 
            // Migration default is 1.
            let invitesAllowed = 1;
            if (targetSettingsCheck.rows.length > 0) {
                invitesAllowed = (targetSettingsCheck.rows[0] as any).recruit_requests;
            }

            if (invitesAllowed === 0) {
                message.reply(`<@${targetId}> is not accepting recruit requests.`);
                return;
            }

            // Add
            await db.execute({
                sql: 'INSERT INTO recruits (owner_id, recruit_id, keyword, created_at) VALUES (?, ?, ?, ?)',
                args: [userId, targetId, keyword, Date.now()]
            });

            message.reply(`Successfully recruited <@${targetId}> as \`${keyword}\`.`);
            return;
        }

        // Default Help Embed
        const helpEmbed = new EmbedBuilder()
            .setTitle('Recruit Usage:')
            .setDescription(
                '`~recruit <alt> <keyword>` to recruit an alternate account\n' +
                '`~recruit list` to view your alt list\n' +
                '`~recruit rename <keyword> <new keyword>` to rename an alt\n' +
                '`~recruit remove <alt>` to remove an alt from your list [7d Cooldown]\n' +
                '~~`~recruit toggle` to toggle requests on or off. (Default is off)~~\n' +
                'Sub command moved to `~settings`!'
            )
            .setColor('#2f3136');
        message.reply({ embeds: [helpEmbed] });
    },
};

export default command;
