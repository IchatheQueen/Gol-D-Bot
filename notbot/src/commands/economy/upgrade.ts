import { Message, Client, EmbedBuilder } from 'discord.js';
import { Command } from '../../handlers/commandHandler';
import { getUserColor } from '../../database/userColor';
import { adjustInventoryItem, getInventoryItem } from '../../database/inventory';
import { getVaultTier, setVaultTier, upgradeCost, capacityDigits, VAULT_TOKEN_ITEM } from '../../database/vault';
import { userTag } from '../../utils/userTag';

const command: Command = {
    name: 'upgrade',
    description: 'Upgrades your vault.',
    usage: '~upgrade',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;

        const tier = await getVaultTier(userId);
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
