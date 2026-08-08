import { Message, Client, EmbedBuilder } from 'discord.js';
import { adjustFunds } from '../../database/economy';
import { addInventoryItem } from '../../database/inventory';
import { VAULT_TOKEN_ITEM } from '../../database/vault';
import { rollEventCurrency } from '../../database/events';

// Roughly 1 in 5 grabbed wallets also contains a Vault Token.
const VAULT_TOKEN_DROP_CHANCE = 0.2;
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';
import { getUserColor } from '../../database/userColor';
import { formatBigNumber } from '../../utils/bigNumbers';

const command: Command = {
    name: 'grab',
    description: 'Grab a dropped wallet',
    execute: async (message: Message, args: string[], client: Client) => {
        const channelId = message.channel.id;

        // Claim the drop by deleting it and reading the amount back in one
        // statement. Only one caller can win the DELETE, so two people typing
        // ~grab at the same moment can no longer both get paid.
        const result = await db.execute({
            sql: 'DELETE FROM wallet_drops WHERE channel_id = ? RETURNING amount',
            args: [channelId]
        });

        const drop = result.rows[0];

        if (!drop) {
            const embed = new EmbedBuilder()
                .setDescription('There are currently no wallets dropped in this channel!')
                .setColor(getUserColor(message.author.id));
            message.reply({ embeds: [embed] });
            return;
        }

        // Add money to user
        const amount = BigInt(drop.amount as string);
        await adjustFunds(message.author.id, { balance: amount });

        // Vault Tokens "can be earned through hunting, mining, grabbing
        // wallets and more" — this is the grabbing-wallets path.
        const lines = [`• 💵 ${formatBigNumber(amount)}`];

        if (Math.random() < VAULT_TOKEN_DROP_CHANCE) {
            await addInventoryItem(message.author.id, VAULT_TOKEN_ITEM, 1n);
            lines.push(`• 🎫 1 Vault Token`);
        }

        // No-ops outside of a seasonal event window.
        const found = await rollEventCurrency(message.author.id);
        if (found) {
            lines.push(`• ${found.event.currencyEmoji} ${found.amount} ${found.event.currencyName}`);
        }

        // Send success message
        const embed = new EmbedBuilder()
            .setDescription(`@${message.author.username} snatches a wallet and found:\n${lines.join('\n')}`)
            .setColor(getUserColor(message.author.id));
        await message.reply({ embeds: [embed] });
    },
};

export default command;
