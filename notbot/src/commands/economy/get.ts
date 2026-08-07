import { Message, Client, EmbedBuilder } from 'discord.js';
import { Command } from '../../handlers/commandHandler';
import { getUser } from '../../database/economy';
import { getInventoryItem } from '../../database/inventory';
import { getUserColor } from '../../database/userColor';
import { formatBigNumber } from '../../utils/bigNumbers';
import { userTag } from '../../utils/userTag';
import db from '../../database/db';

/**
 * Shows a single holding. Argument list matches the reference bot's:
 * bal, beer, weed, opioid, ster, can, opi, pot, lin, shares
 */
type Holding = { label: string; emoji: string; read: (userId: string) => Promise<bigint> };

const HOLDINGS: Record<string, Holding> = {
    bal: { label: 'Balance', emoji: '💵', read: async (u) => (await getUser(u)).balance },
    beer: { label: 'Beer', emoji: '🍺', read: (u) => getInventoryItem(u, 'beer') },
    weed: { label: 'Weed', emoji: '🌿', read: (u) => getInventoryItem(u, 'weed') },
    opioid: { label: 'Opioids', emoji: '💊', read: (u) => getInventoryItem(u, 'opioid') },
    ster: { label: 'Steroids', emoji: '💉', read: (u) => getInventoryItem(u, 'steroid') },
    can: { label: 'Cannabis Plants', emoji: '🌱', read: (u) => getInventoryItem(u, '102') },
    opi: { label: 'Opium Poppies', emoji: '🌹', read: (u) => getInventoryItem(u, '103') },
    pot: { label: 'Cotton', emoji: '☁️', read: (u) => getInventoryItem(u, 'cotton') },
    lin: { label: 'Linen', emoji: '📜', read: (u) => getInventoryItem(u, 'linen') },
    shares: {
        label: 'Shares', emoji: '📈', read: async (u) => {
            const result = await db.execute({
                sql: 'SELECT shares FROM stocks WHERE user_id = ?',
                args: [u]
            });
            return (result.rows as any[]).reduce((sum, row) => sum + BigInt(row.shares || '0'), 0n);
        }
    },
};

const command: Command = {
    name: 'get',
    description: 'Check a single one of your holdings',
    usage: '~get <type>',
    execute: async (message: Message, args: string[], client: Client) => {
        const typeArg = args[0]?.toLowerCase();
        const keys = Object.keys(HOLDINGS);

        if (!typeArg || !HOLDINGS[typeArg]) {
            // "... `lin`, and `shares`" — the final item is preceded by "and".
            const quoted = keys.map(k => `\`${k}\``);
            const list = quoted.slice(0, -1).join(', ') + ', and ' + quoted[quoted.length - 1];
            message.reply(`The supported arguments for this command are ${list}`);
            return;
        }

        const holding = HOLDINGS[typeArg];
        const amount = await holding.read(message.author.id);

        const embed = new EmbedBuilder()
            .setDescription(`${userTag(message)}'s ${holding.label}\n${holding.emoji} ${formatBigNumber(amount)}`)
            .setColor(getUserColor(message.author.id));

        message.reply({ embeds: [embed] });
    },
};

export default command;
