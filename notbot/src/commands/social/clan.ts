import { Message, Client, EmbedBuilder } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';
import { getInventoryItem, removeInventoryItem } from '../../database/inventory';

const CLAN_CREATION_COST = 1000000; // 1M Credits

const command: Command = {
    name: 'clan',
    description: 'Manage clans: create, join, info, invite, leave, kick, deposit',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;
        const subCommand = args[0]?.toLowerCase();

        if (!subCommand) {
            message.reply('Usage: `~clan <create|join|info|invite|leave|kick|deposit> [args]`');
            return;
        }

        // --- CREATE ---
        if (subCommand === 'create') {
            const name = args.slice(1).join(' ');
            if (!name) {
                message.reply('Usage: `~clan create <name>`');
                return;
            }
            if (name.length > 20) {
                message.reply('Name too long (max 20 chars).');
                return;
            }

            const existingMember = await db.execute({ sql: 'SELECT * FROM clan_members WHERE user_id = ?', args: [userId] });
            if (existingMember.rows.length > 0) {
                message.reply('You are already in a clan! Leave it first.');
                return;
            }

            const userRes = await db.execute({ sql: 'SELECT credits FROM users WHERE id = ?', args: [userId] });
            const userCredits = BigInt((userRes.rows[0]?.credits as string) || '0');

            if (userCredits < BigInt(CLAN_CREATION_COST)) {
                message.reply(`You need **${CLAN_CREATION_COST.toLocaleString()}** credits to form a clan.`);
                return;
            }

            try {
                await db.execute({ sql: 'UPDATE users SET credits = credits - ? WHERE id = ?', args: [CLAN_CREATION_COST, userId] });
                await db.execute({ sql: 'INSERT INTO clans (name, owner_id, created_at) VALUES (?, ?, ?)', args: [name, userId, Date.now()] });
                const idRes = await db.execute('SELECT last_insert_rowid() as id');
                const clanId = idRes.rows[0].id;
                await db.execute({ sql: 'INSERT INTO clan_members (clan_id, user_id, role, joined_at) VALUES (?, ?, ?, ?)', args: [clanId, userId, 'leader', Date.now()] });
                message.reply(`✅ Clan **${name}** created successfully!`);
            } catch (err: any) {
                if (err.message && err.message.includes('UNIQUE constraint failed')) {
                    message.reply('A clan with that name already exists.');
                } else {
                    console.error(err);
                    message.reply('Failed to create clan.');
                }
            }
            return;
        }

        // --- INFO ---
        if (subCommand === 'info') {
            let targetId = userId;
            const mention = message.mentions.users.first();
            if (mention) targetId = mention.id;

            const memberRes = await db.execute({
                sql: `SELECT cm.*, c.name, c.level, c.balance, c.description 
                      FROM clan_members cm 
                      JOIN clans c ON cm.clan_id = c.id 
                      WHERE cm.user_id = ?`,
                args: [targetId]
            });

            if (memberRes.rows.length === 0) {
                message.reply(targetId === userId ? 'You are not in a clan.' : 'User is not in a clan.');
                return;
            }

            const data = memberRes.rows[0] as any;
            const countRes = await db.execute({ sql: 'SELECT COUNT(*) as count FROM clan_members WHERE clan_id = ?', args: [data.clan_id] });
            const memberCount = (countRes.rows[0] as any).count || 0;

            const embed = new EmbedBuilder()
                .setTitle(`🛡️ ${data.name}`)
                .setDescription(data.description)
                .setColor('#FFD700')
                .addFields(
                    { name: 'Level', value: data.level.toString(), inline: true },
                    { name: 'Members', value: memberCount.toString(), inline: true },
                    { name: 'Bank', value: `💰 ${BigInt(data.balance).toLocaleString()}`, inline: true },
                    { name: 'Your Role', value: (data.role as string).toUpperCase(), inline: true }
                );
            message.reply({ embeds: [embed] });
            return;
        }

        // --- INVITE ---
        if (subCommand === 'invite') {
            const memberRes = await db.execute({ sql: 'SELECT clan_id, role FROM clan_members WHERE user_id = ?', args: [userId] });
            if (memberRes.rows.length === 0) { message.reply('You are not in a clan.'); return; }

            const memberData = memberRes.rows[0] as any;
            if (memberData.role === 'member') { message.reply('Only leaders and officers can invite members.'); return; }

            const targetUser = await resolveUser(message, args[1], client);
            if (!targetUser) { message.reply('Usage: `~clan invite <user>`'); return; }
            if (targetUser.bot) { message.reply('You cannot invite bots.'); return; }

            const targetMemberCheck = await db.execute({ sql: 'SELECT * FROM clan_members WHERE user_id = ?', args: [targetUser.id] });
            if (targetMemberCheck.rows.length > 0) { message.reply('That user is already in a clan.'); return; }

            const expiresAt = Date.now() + 300000; // 5 mins
            await db.execute({
                sql: `INSERT INTO clan_invites (clan_id, user_id, invited_by, expires_at) VALUES (?, ?, ?, ?)
                      ON CONFLICT(clan_id, user_id) DO UPDATE SET expires_at = ?`,
                args: [memberData.clan_id, targetUser.id, userId, expiresAt, expiresAt]
            });
            message.reply(`Invite sent to **${targetUser.username}**. They can type \`~clan join\` to join.`);
            return;
        }

        // --- JOIN ---
        if (subCommand === 'join') {
            const invites = await db.execute({ sql: 'SELECT * FROM clan_invites WHERE user_id = ? AND expires_at > ?', args: [userId, Date.now()] });
            if (invites.rows.length === 0) { message.reply('You have no active clan invites.'); return; }

            let clanIdToJoin = invites.rows[0].clan_id as number;
            // Simplified join: just joins the first active invite.

            await db.execute({ sql: 'INSERT INTO clan_members (clan_id, user_id, role, joined_at) VALUES (?, ?, ?, ?)', args: [clanIdToJoin, userId, 'member', Date.now()] });
            await db.execute({ sql: 'DELETE FROM clan_invites WHERE user_id = ?', args: [userId] });
            message.reply('Welcome to the clan! 🛡️');
            return;
        }

        // --- DEPOSIT ---
        if (subCommand === 'deposit') {
            const memberRes = await db.execute({ sql: 'SELECT clan_id FROM clan_members WHERE user_id = ?', args: [userId] });
            if (memberRes.rows.length === 0) { message.reply('You are not in a clan.'); return; }
            const clanId = memberRes.rows[0].clan_id;

            const amountStr = args[1];
            if (!amountStr || isNaN(Number(amountStr)) && amountStr !== 'all') { message.reply('Usage: `~clan deposit <amount|all>`'); return; }

            const userRes = await db.execute({ sql: 'SELECT credits FROM users WHERE id = ?', args: [userId] });
            const userCredits = BigInt((userRes.rows[0]?.credits as string) || '0');

            let amount = 0n;
            if (amountStr === 'all') amount = userCredits;
            else amount = BigInt(amountStr);

            if (amount <= 0n) { message.reply('Invalid amount.'); return; }
            if (userCredits < amount) { message.reply('Insufficient credits.'); return; }

            await db.execute({ sql: 'UPDATE users SET credits = credits - ? WHERE id = ?', args: [amount.toString(), userId] });
            // Update clan balance
            // Reading clan balance first to add bigints safely
            const clanRes = await db.execute({ sql: 'SELECT balance FROM clans WHERE id = ?', args: [clanId] });
            const currentBalance = BigInt((clanRes.rows[0].balance as string) || '0');
            const newBalance = currentBalance + amount;

            await db.execute({ sql: 'UPDATE clans SET balance = ? WHERE id = ?', args: [newBalance.toString(), clanId] });
            message.reply(`Deposited **${amount.toLocaleString()}** credits to the clan bank.`);
            return;
        }

        // --- LEAVE ---
        if (subCommand === 'leave') {
            const memberRes = await db.execute({ sql: 'SELECT clan_id, role FROM clan_members WHERE user_id = ?', args: [userId] });
            if (memberRes.rows.length === 0) { message.reply('You are not in a clan.'); return; }

            if (memberRes.rows[0].role === 'leader') {
                message.reply('Leaders cannot leave. You must delete the clan or transfer ownership (transfer not implemented yet).');
                return;
            }

            await db.execute({ sql: 'DELETE FROM clan_members WHERE user_id = ?', args: [userId] });
            message.reply('You have left the clan.');
            return;
        }

        // --- KICK ---
        if (subCommand === 'kick') {
            const memberRes = await db.execute({ sql: 'SELECT clan_id, role FROM clan_members WHERE user_id = ?', args: [userId] });
            if (memberRes.rows.length === 0) { message.reply('You are not in a clan.'); return; }

            const memberData = memberRes.rows[0] as any;
            if (memberData.role === 'member') { message.reply('You do not have permission to kick.'); return; }

            const targetUser = await resolveUser(message, args[1], client);
            if (!targetUser) { message.reply('Usage: `~clan kick <user>`'); return; }

            const targetData = await db.execute({ sql: 'SELECT role FROM clan_members WHERE user_id = ? AND clan_id = ?', args: [targetUser.id, memberData.clan_id] });
            if (targetData.rows.length === 0) { message.reply('User is not in your clan.'); return; }

            if (targetData.rows[0].role === 'leader') { message.reply('Cannot kick the leader.'); return; }

            // Officers cannot kick officers? Let's say yes for simplicity.

            await db.execute({ sql: 'DELETE FROM clan_members WHERE user_id = ?', args: [targetUser.id] });
            message.reply(`Kicked **${targetUser.username}** from the clan.`);
            return;
        }

        message.reply('Unknown subcommand.');
    }
};

// Simple resolve helper since importing complex one might account for the lint issues
async function resolveUser(message: Message, arg: string, client: Client) {
    if (!arg) return null;
    const mention = message.mentions.users.first();
    if (mention) return mention;
    try { return await client.users.fetch(arg); } catch { return null; }
}

export default command;
