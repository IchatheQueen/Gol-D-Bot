import { Message, Client, EmbedBuilder } from 'discord.js';
import { getUser } from '../../database/economy';
import { Command } from '../../handlers/commandHandler';
import { getUserColor } from '../../database/userColor';
import { formatBigNumber } from '../../utils/bigNumbers';
import { resolveTargetOrSelf } from '../../utils/resolveTarget';
import { userTagById } from '../../utils/userTag';
import { getInventoryItem } from '../../database/inventory';
import { getVaultTier, capacityDigits, upgradeCost, digitsUsed, VAULT_TOKEN_ITEM } from '../../database/vault';

const command: Command = {
    name: 'vault',
    description: 'Checks your vault. The vault is a limited amount of storage to place your balance in without it being stolen by other users.',
    usage: '~vault',
    execute: async (message: Message, args: string[], client: Client) => {
        if (args[0]?.toLowerCase() === 'help') {
            const helpEmbed = new EmbedBuilder()
                .setTitle('Vault Help')
                .setDescription("Here's some information regarding the currencies that are currently guarded against attackers")
                .setColor(getUserColor(message.author.id))
                .addFields(
                    {
                        name: '💵 Money Vault',
                        value:
                            '`~deposit <amount>` to deposit your 💵 Money\n' +
                            '`~withdraw <amount>` to withdraw your 💵 Money\n' +
                            "`~upgrade` to upgrade your vault's maximum capacity\n\n" +
                            "Use 🎫 Vault Tokens to upgrade your vault's Maximum Capacity. " +
                            '🎫 Vault Tokens can be earned through hunting, mining, grabbing wallets and more.',
                        inline: false
                    },
                    {
                        name: '💎 Gems',
                        value: 'Earned from plunging into the depths of the Mines via `~mine`, and can be used to purchase 🎱 **Miner\'s Capsules** from the `~pub`, or other misc items/perks',
                        inline: false
                    }
                );

            message.reply({ embeds: [helpEmbed] });
            return;
        }

        const target = await resolveTargetOrSelf(message, args, client);
        const user = await getUser(target.id);

        const tier = await getVaultTier(target.id);
        const tokens = await getInventoryItem(target.id, VAULT_TOKEN_ITEM);
        const cost = upgradeCost(tier);

        // Gems are fractional (a Miner's Capsule costs 💎 0.20), so they are
        // stored as hundredths and rendered as a decimal.
        const gemHundredths = await getInventoryItem(target.id, 'gem');
        const gems = (Number(gemHundredths) / 100).toFixed(1);

        const embed = new EmbedBuilder()
            .setTitle(`${userTagById(message, target.id, target.username)}'s Currency Vault`)
            .setDescription('Currencies in your vault cannot be attacked or stolen by other players.\n`~vault help` for more information')
            .setColor(getUserColor(message.author.id))
            .addFields(
                { name: 'Gems Vault', value: `💎 ${gems}`, inline: false },
                {
                    name: `Money Vault [🎫 T${tier}]`,
                    value:
                        `💰 Stored: 💵 ${formatBigNumber(user.vault)}\n` +
                        `🔒 Current Limit: 💵 ${capacityDigits(tier)} Digits (using ${digitsUsed(user.vault)} Digits)\n` +
                        `📈 Upgrade Cost: 🎫 ${cost} tokens needed (🎫 ${formatBigNumber(tokens)} Total)`,
                    inline: false
                }
            );

        message.reply({ embeds: [embed] });
    },
};

export default command;
