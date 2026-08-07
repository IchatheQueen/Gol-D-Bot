import { Message, Client, EmbedBuilder } from 'discord.js';
import { getUser, adjustFunds } from '../../database/economy';
import { Command } from '../../handlers/commandHandler';
import { formatBigNumber } from '../../utils/bigNumbers';
import { getUserColor } from '../../database/userColor';
import { getVaultTier, vaultCapacity } from '../../database/vault';
import { userTag } from '../../utils/userTag';

/**
 * Vaults everything in your wallet, clamped to whatever storage is left.
 */
const command: Command = {
    name: 'done',
    description: 'Vaults your entire wallet, up to your remaining storage',
    usage: '~done',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;
        const user = await getUser(userId);

        if (user.balance <= 0n) {
            message.reply('You have no money in your wallet to vault!');
            return;
        }

        const tier = await getVaultTier(userId);
        const room = vaultCapacity(tier) - user.vault;

        if (room <= 0n) {
            message.reply('Your vault is full! Use `~upgrade` to raise its capacity.');
            return;
        }

        const amount = user.balance > room ? room : user.balance;

        const ok = await adjustFunds(userId, { balance: -amount, vault: amount });

        if (!ok) {
            message.reply('You have no money in your wallet to vault!');
            return;
        }

        const clamped = amount < user.balance;

        const embed = new EmbedBuilder()
            .setDescription(
                `${userTag(message)} has successfully vaulted 💵 ${formatBigNumber(amount)}.` +
                (clamped ? `\n\n⚠️ We've automatically adjusted the amount to account for your remaining storage!` : '')
            )
            .setColor(getUserColor(userId));

        message.reply({ embeds: [embed] });
    },
};

export default command;
