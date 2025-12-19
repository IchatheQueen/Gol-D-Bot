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
        const id = args[0];
        const amount = parseBigNumber(args[1] || '1') || 1n;

        if (!id) {
            message.reply('You must specify an ID for this command to work!\n👁️ Hint: IDs are numerical, but names also work! E.g; ~exch weed');
            return;
        }

        const item = blackMarketItems[id];
        if (!item) {
            message.reply('Invalid item ID.');
            return;
        }

        const user = await getUser(message.author.id);
        const totalCostBig = BigInt(item.price) * BigInt(amount);

        // Deduct payment first
        if (item.currency === 'cash') {
            if (user.balance < totalCostBig) {
                message.reply(`You don't have enough cash! Cost: 💵 ${formatBigNumber(totalCostBig)}`);
                return;
            }
            await updateUser(message.author.id, { balance: user.balance - totalCostBig });
        } else if (item.currency === 'weed') {
            const weedAmount = await getInventoryItem(message.author.id, '1');
            if (weedAmount < totalCostBig) {
                message.reply(`You don't have 🌿 ${formatBigNumber(totalCostBig)}... (${totalCostBig.toString().length} digits)`);
                return;
            }
            await removeInventoryItem(message.author.id, '1', totalCostBig);
        } else if (item.currency === 'opioid') {
            const opioidAmount = await getInventoryItem(message.author.id, '3');
            if (opioidAmount < totalCostBig) {
                message.reply(`You don't have 💊 ${formatBigNumber(totalCostBig)}... (${totalCostBig.toString().length} digits)`);
                return;
            }
            await removeInventoryItem(message.author.id, '3', totalCostBig);
        }

        // Scam chance: 30% normally
        let scamChance = 0.30;
        if (Math.random() < scamChance) {
            // SCAMMED!
            const currencyEmoji = item.currency === 'cash' ? '💵' : item.currency === 'weed' ? '🌿' : '💊';
            const displayName = message.guild?.members.cache.get(message.author.id)?.displayName || message.author.username;
            const embed = new EmbedBuilder()
                .setDescription(`${displayName} (@${message.author.username}) has paid ${currencyEmoji} ${formatBigNumber(totalCostBig)}... (${totalCostBig.toString().length} digits) and gotten scammed!`)
                .setColor('#2b2d31');
            message.reply({ embeds: [embed] });
            return;
        }

        // Add item to inventory
        await addInventoryItem(message.author.id, item.id, BigInt(amount));

        const itemEmoji = resolveEmoji(client, item.emoji || '📦');
        const displayName = message.guild?.members.cache.get(message.author.id)?.displayName || message.author.username;
        const embed = new EmbedBuilder()
            .setDescription(`${displayName} (@${message.author.username}) has successfully purchased ${itemEmoji} ${formatBigNumber(BigInt(amount))}... (${BigInt(amount).toString().length} digits)! ~druga`)
            .setColor('#2b2d31');
        message.reply({ embeds: [embed] });
    },
};

export default command;
