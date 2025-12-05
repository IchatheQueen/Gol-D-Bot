import { Message, Client, EmbedBuilder } from 'discord.js';
import { getInventoryItem, removeInventoryItem, addInventoryItem } from '../../database/inventory';
import { Command } from '../../handlers/commandHandler';

const command: Command = {
    name: 'print',
    description: 'Print counterfeit money',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;
        const stacks = parseInt(args[0]) || 1;

        if (stacks < 1 || stacks > 10) {
            message.reply('You can print between 1 and 10 stacks at a time.');
            return;
        }

        // Check if user has a printer
        const printerAmount = await getInventoryItem(userId, 'printer');
        if (printerAmount < 1n) {
            message.reply('You need a 🖨️ **Printer** to print money! Buy one from the Black Market (`~bm`).');
            return;
        }

        // Check if user has materials (per stack: 1 Ink, 1 Linen, 3 Cotton)
        const inkNeeded = BigInt(stacks);
        const linenNeeded = BigInt(stacks);
        const cottonNeeded = BigInt(stacks * 3);

        const inkAmount = await getInventoryItem(userId, 'ink');
        const linenAmount = await getInventoryItem(userId, 'linen');
        const cottonAmount = await getInventoryItem(userId, 'cotton');

        const hasInk = inkAmount >= inkNeeded;
        const hasLinen = linenAmount >= linenNeeded;
        const hasCotton = cottonAmount >= cottonNeeded;

        if (!hasInk || !hasLinen || !hasCotton) {
            message.reply(`You need **${inkNeeded}x 📼 Ink**, **${linenNeeded}x 📜 Linen**, and **${cottonNeeded}x ☁️ Cotton** to print ${stacks} stack(s).\n\nYou have: ${inkAmount}x Ink, ${linenAmount}x Linen, ${cottonAmount}x Cotton.`);
            return;
        }

        // Consume materials
        await removeInventoryItem(userId, 'ink', inkNeeded);
        await removeInventoryItem(userId, 'linen', linenNeeded);
        await removeInventoryItem(userId, 'cotton', cottonNeeded);

        // 1/3 chance to fail per stack
        let successfulPrints = 0;
        let failedPrints = 0;
        for (let i = 0; i < stacks; i++) {
            if (Math.random() < 0.33) {
                failedPrints++;
            } else {
                successfulPrints++;
            }
        }

        // Calculate counterfeit amount (3-17 per stack)
        let totalCounterfeit = 0;
        for (let i = 0; i < successfulPrints; i++) {
            totalCounterfeit += Math.floor(Math.random() * (17 - 3 + 1)) + 3;
        }

        // Add counterfeit to inventory
        if (totalCounterfeit > 0) {
            await addInventoryItem(userId, 'counterfeit', BigInt(totalCounterfeit));
        }

        const embed = new EmbedBuilder()
            .setTitle('🖨️ Printing Results')
            .setColor(failedPrints > 0 ? '#ff6600' : '#00ff00');

        let description = '';
        if (successfulPrints > 0) {
            description += `✅ **${successfulPrints}** stack(s) printed successfully!\n`;
            description += `💵 You received **${totalCounterfeit}x 💸 Counterfeit**!\n`;
        }
        if (failedPrints > 0) {
            description += `❌ **${failedPrints}** stack(s) failed! (Jammed)\n`;
        }

        embed.setDescription(description);
        embed.setFooter({ text: `Materials used: ${inkNeeded}x Ink, ${linenNeeded}x Linen, ${cottonNeeded}x Cotton` });

        message.reply({ embeds: [embed] });
    },
};

export default command;
