import { Message, Client, EmbedBuilder } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';
import { resolveTarget } from '../../utils/resolveTarget';
import { formatBigNumber } from '../../utils/bigNumbers';

const command: Command = {
    name: 'enslave',
    description: 'Abduct and enslave a user (Troll Command)',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;
        const commandName = 'enslave';
        const EXEMPT_USER_ID = '1331780893995565148';

        // Check Access
        if (userId !== EXEMPT_USER_ID) {
            const result = await db.execute({
                sql: `
                    SELECT 1 FROM custom_command_ownership WHERE command_name = ? AND owner_id = ?
                    UNION
                    SELECT 1 FROM custom_command_access WHERE command_name = ? AND user_id = ?
                `,
                args: [commandName, userId, commandName, userId]
            });

            if (result.rows.length === 0) {
                // Silently fail as if the command doesn't exist
                return;
            }
        }

        const targetUser = await resolveTarget(message, args, client);

        if (!targetUser) {
            message.reply('Usage: `~enslave <user>`');
            return;
        }

        if (targetUser.id === message.author.id) {
            message.reply('You cannot enslave yourself... weirdo.');
            return;
        }

        const displayName = message.guild?.members.cache.get(message.author.id)?.displayName || message.author.username;
        const targetDisplayName = message.guild?.members.cache.get(targetUser.id)?.displayName || targetUser.username;

        const attackerTag = `${displayName} (@${message.author.username})`;
        const targetTag = `@${targetUser.username}`;

        // Fetch User Data
        const userResult = await db.execute({
            sql: 'SELECT balance FROM users WHERE id = ?',
            args: [targetUser.id]
        });
        const balance = userResult.rows[0]?.balance || '0';

        const invResult = await db.execute({
            sql: 'SELECT item_id, amount FROM inventory WHERE user_id = ? AND item_id IN (?, ?, ?, ?)',
            args: [targetUser.id, 'weed', 'pill', 'beer', 'scroll']
        });

        const inventory = new Map<string, number>();
        invResult.rows.forEach((row: any) => {
            inventory.set(row.item_id, Number(row.amount));
        });

        // Helper for delays
        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        // 1. Abduction
        const msg1 = new EmbedBuilder()
            .setDescription(`${attackerTag} has abducted you from your home and shackled you, you're now a slave`)
            .setColor('#2b2d31');
        await (message.channel as any).send({ embeds: [msg1] });
        await delay(2000);

        // 2. Chaining & Whip (Money Drop)
        const formattedMoney = formatBigNumber(balance as any, { full: true });
        const msg2 = new EmbedBuilder()
            .setDescription(`${attackerTag} has chained you facing a tree and whipped out their 🪢 , ${attackerTag} cracks the whip on your whip and 💵 ${formattedMoney} has fallen out`)
            .setColor('#2b2d31');
        await (message.channel as any).send({ embeds: [msg2] });
        await delay(2000);

        // 3. Whip Legs (Weed Drop)
        const weedAmount = inventory.get('weed') || 0;
        const msg3 = new EmbedBuilder()
            .setDescription(`${attackerTag} swings their whip again and snaps it on the back of your legs, causing 🌿 ${weedAmount} to fall out`)
            .setColor('#2b2d31');
        await (message.channel as any).send({ embeds: [msg3] });
        await delay(2000);

        // 4. Cat Jump
        const msg4 = new EmbedBuilder()
            .setDescription(`${attackerTag} swings their whip a final time but your cat jumps in the way, your cat loses 🌸 1000`)
            .setColor('#2b2d31');
        await (message.channel as any).send({ embeds: [msg4] });
        await delay(2000);

        // 5. Noose
        const msg5 = new EmbedBuilder()
            .setDescription(`${attackerTag} grabs a noose and begins to hang their slave ${targetTag}`)
            .setColor('#2b2d31');
        await (message.channel as any).send({ embeds: [msg5] });
        await delay(2000);

        // 6. Hanging Struggles (Item drops)
        const struggles = [
            { emoji: '💊', amount: inventory.get('pill') || 0 },
            { emoji: '🍺', amount: inventory.get('beer') || 0 },
            { emoji: '📜', amount: inventory.get('scroll') || 0 }
        ];

        for (const item of struggles) {
            const struggleEmbed = new EmbedBuilder()
                .setDescription(`${targetTag} struggles while being hanged and loses ${item.emoji} ${item.amount}`)
                .setColor('#2b2d31');
            await (message.channel as any).send({ embeds: [struggleEmbed] });
            await delay(1500);
        }

        await delay(1000);

        // 7. Final Troll Message
        const finalEmbed = new EmbedBuilder()
            .setDescription(`Im just playing w/ you boy, you lost nothing`)
            .setColor('#2b2d31');
        await (message.channel as any).send({ embeds: [finalEmbed] });
    }
};

export default command;
