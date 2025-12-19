import { Message, Client, EmbedBuilder } from 'discord.js';
import { blackMarketItems } from '../../data/blackMarketItems';
import { getUser, updateUser } from '../../database/economy';
import { getInventoryItem, addInventoryItem, removeInventoryItem } from '../../database/inventory';
import { Command } from '../../handlers/commandHandler';
import { hasActiveDrugEffect } from '../../database/drugEffects';
import { getUserColor } from '../../database/userColor';
import { formatBigNumber, parseBigNumber } from '../../utils/bigNumbers';
import { resolveEmoji } from '../../utils/resolveEmoji';

const command: Command = {
    name: 'exch',
    description: 'Exchange items in the Black Market',
    execute: async (message: Message, args: string[], client: Client) => {
        let id = args[0];
        const amount = parseBigNumber(args[1] || '1') || 1n;

        if (!id) {
            message.reply('You must specify an ID for this command to work!\n👁️ Hint: IDs are numerical! E.g; ~exch 001');
            return;
        }

        // Pad ID if numeric to match blackMarketItems keys (001, 002, etc)
        if (/^\d+$/.test(id)) {
            id = id.padStart(3, '0');
        }

        const item = blackMarketItems[id];
        if (!item) {
            message.reply('Invalid item ID.');
            return;
        }

        const user = await getUser(message.author.id);
        const itemPriceBig = BigInt(item.price.toString());
        const totalCostBig = itemPriceBig * BigInt(amount);

        // Deduct payment
        if (item.currency === 'complex' && item.paymentItems) {
            for (const p of item.paymentItems) {
                const totalReq = p.amount * BigInt(amount);
                const userOwned = await getInventoryItem(message.author.id, p.id);
                if (userOwned < totalReq) {
                    message.reply(`You don't have enough ${p.id}! Need ${totalReq}, have ${userOwned}.`);
                    return;
                }
                await removeInventoryItem(message.author.id, p.id, totalReq);
            }
        } else if (item.currency === 'cash') {
            if (user.balance < totalCostBig) {
                message.reply(`You don't have enough cash! Cost: 💵 ${formatBigNumber(totalCostBig)}`);
                return;
            }
            await updateUser(message.author.id, { balance: user.balance - totalCostBig });
        } else {
            // Mapping for other currencies to inventory IDs
            const currencyMap: Record<string, string> = {
                'weed': '1',
                'opioid': 'opioid',
                'steroid': 'steroid',
                'counterfeit_cash': 'counterfeit_cash'
            };
            const invId = currencyMap[item.currency];
            if (invId) {
                const userOwned = await getInventoryItem(message.author.id, invId);
                if (userOwned < totalCostBig) {
                    message.reply(`You don't have enough ${item.currency}! Cost: ${formatBigNumber(totalCostBig)}`);
                    return;
                }
                await removeInventoryItem(message.author.id, invId, totalCostBig);
            }
        }

        // Scam chance: 30% normally
        let scamChance = 0.30;
        if (Math.random() < scamChance) {
            const displayName = message.guild?.members.cache.get(message.author.id)?.displayName || message.author.username;
            const embed = new EmbedBuilder()
                .setDescription(`${displayName} (@${message.author.username}) has paid for ${item.name} and gotten scammed!`)
                .setColor('#2b2d31');
            message.reply({ embeds: [embed] });
            return;
        }

        // Add item to inventory
        await addInventoryItem(message.author.id, item.id, BigInt(amount));

        const displayName = message.guild?.members.cache.get(message.author.id)?.displayName || message.author.username;
        const embed = new EmbedBuilder()
            .setDescription(`${displayName} (@${message.author.username}) has successfully purchased ${item.emoji} ${formatBigNumber(BigInt(amount))} ${item.name}!`)
            .setColor('#2b2d31');
        message.reply({ embeds: [embed] });
    },
};

export default command;
