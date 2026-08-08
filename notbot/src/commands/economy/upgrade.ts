import { Message, Client, EmbedBuilder } from 'discord.js';
import { Command } from '../../handlers/commandHandler';
import { getUserColor } from '../../database/userColor';
import { adjustInventoryItem, getInventoryItem } from '../../database/inventory';
import { getVaultTier, setVaultTier, upgradeCost, capacityDigits, vaultCapacity, MAX_VAULT_TIER, VAULT_TOKEN_ITEM } from '../../database/vault';
import { userTag } from '../../utils/userTag';
import { getUser } from '../../database/economy';
import { formatBigNumber } from '../../utils/bigNumbers';

const command: Command = {
    name: 'upgrade',
    description: 'Upgrades your vault.',
    usage: '~upgrade',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;

        const tier = await getVaultTier(userId);

        if (tier >= MAX_VAULT_TIER) {
            message.reply(`Your vault is already at the maximum tier of 🎫 **T${MAX_VAULT_TIER}**!`);
            return;
        }

        // A tier only unlocks once its own capacity is full. Measured against
        // the flat tier capacity, not the Gold-boosted one — otherwise the
        // bonus digits would put the bar out of reach for the members holding
        // them.
        const user = await getUser(userId);
        const tierCapacity = vaultCapacity(tier);

        if (user.vault < tierCapacity) {
            message.reply(
                `Your vault must be completely full before you can upgrade it!\n` +
                `└ 🔒 Stored: 💵 ${formatBigNumber(user.vault)} / ${formatBigNumber(tierCapacity)}`
            );
            return;
        }

        const cost = upgradeCost(tier);
        const tokens = await getInventoryItem(userId, VAULT_TOKEN_ITEM);

        if (tokens < BigInt(cost)) {
            message.reply(`You don't have enough 🎫 Vault Tokens to upgrade your vault!`);
            return;
        }

        // Spend first — atomically, so two concurrent upgrades can't share tokens.
        const spent = await adjustInventoryItem(userId, VAULT_TOKEN_ITEM, -BigInt(cost));

        if (!spent) {
            message.reply(`You don't have enough 🎫 Vault Tokens to upgrade your vault!`);
            return;
        }

        const newTier = tier + 1;
        await setVaultTier(userId, newTier);

        const embed = new EmbedBuilder()
            .setDescription(
                `${userTag(message)} upgraded their vault to 🎫 **T${newTier}**\n` +
                `└ 🔒 New Limit: 💵 ${capacityDigits(newTier)} Digits\n` +
                `└ 📈 Next Upgrade: 🎫 ${upgradeCost(newTier)} tokens`
            )
            .setColor(getUserColor(userId));

        message.reply({ embeds: [embed] });
    },
};

export default command;
