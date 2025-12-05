import { Message, Client, EmbedBuilder } from 'discord.js';
import { blackMarketItems } from '../../data/blackMarketItems';
import { getUser, updateUser } from '../../database/economy';
import { getInventoryItem, addInventoryItem, removeInventoryItem } from '../../database/inventory';
import { Command } from '../../handlers/commandHandler';
import { hasActiveDrugEffect } from '../../database/drugEffects';
import { getUserColor } from '../../database/userColor';
import { formatBigNumber } from '../../utils/bigNumbers';

const command: Command = {
    name: 'exch',
    description: 'Exchange items in the Black Market',
    execute: async (message: Message, args: string[], client: Client) => {
        const id = args[0];
        const amount = parseInt(args[1]) || 1;

        if (!id) {
            message.reply('Usage: ~exch <id> <amount>');
            return;
        }

        const item = blackMarketItems[id];
        if (!item) {
            message.reply('Invalid item ID.');
            return;
        }

        const user = await getUser(message.author.id);
        let totalCost = item.price * amount;

        // Deduct payment first
        if (item.currency === 'cash') {
            const cashCost = BigInt(totalCost);
            if (user.balance < cashCost) {
                message.reply(`You don't have enough cash! Cost: 💵 ${formatBigNumber(cashCost)}`);
                return;
            }
            await updateUser(message.author.id, { balance: user.balance - cashCost });
        } else if (item.currency === 'weed') {
            const weedAmount = await getInventoryItem(message.author.id, '1');

            if (weedAmount < BigInt(totalCost)) {
                message.reply(`You don't have enough Weed! Cost: 🌿 ${totalCost.toLocaleString()}`);
                return;
            }

            await removeInventoryItem(message.author.id, '1', BigInt(totalCost));
        } else if (item.currency === 'opioid') {
            const opioidAmount = await getInventoryItem(message.author.id, '3');

            if (opioidAmount < BigInt(totalCost)) {
                message.reply(`You don't have enough Opioids! Cost: 💊 ${totalCost.toLocaleString()}`);
                return;
            }

            await removeInventoryItem(message.author.id, '3', BigInt(totalCost));
        }

        // Scam chance: 30% normally, 10% with Steroid active
        let scamChance = 0.30;
        if (await hasActiveDrugEffect(message.author.id, 'ster')) {
            scamChance = 0.10;
        }

        if (Math.random() < scamChance) {
            // SCAMMED!
            const currencyEmoji = item.currency === 'cash' ? '💵' : item.currency === 'weed' ? '🌿' : '💊';
            const embed = new EmbedBuilder()
                .setDescription(`**${message.author.username}** (@${message.author.tag}) has paid ${currencyEmoji} ${totalCost.toLocaleString()} and gotten scammed!`)
                .setColor('#ff0000');
            message.reply({ embeds: [embed] });
            return;
        }

        // Add item to inventory
        const itemId = item.id;
        await addInventoryItem(message.author.id, itemId, BigInt(amount));

        // Item emojis based on what they bought
        const itemEmojis: Record<string, string> = {
            '1': '🌿', // Weed
            '2': '💵', // 12B
            '3': '💊', // Opioid
            '4': '💉', // Steroid
            '5': '💉', // Anesthesia
            '6': '🌀', // LSD
            '102': '🌱', // Cannabis Plant
            '103': '🌹', // Opium Plant
            '104': '🌾', // Linen Plant
            '105': '🌿', // Cotton Plant
            '201': '📼', // Ink
            '204': '🖨️', // Printer
        };
        const itemEmoji = itemEmojis[item.id] || '📦';

        const embed = new EmbedBuilder()
            .setDescription(`**${message.author.username}** (@${message.author.username}) has successfully purchased ${itemEmoji} ${totalCost.toLocaleString()}!`)
            .setColor(getUserColor(message.author.id));
        message.reply({ embeds: [embed] });
    },
};

export default command;
