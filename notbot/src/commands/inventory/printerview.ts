import { Message, Client, EmbedBuilder } from 'discord.js';
import { Command } from '../../handlers/commandHandler';
import { getInventoryItem } from '../../database/inventory';
import { getUserColor } from '../../database/userColor';
import { formatBigNumber } from '../../utils/bigNumbers';
import { userTag } from '../../utils/userTag';

/**
 * "Displays your printer and how much ink, cotton, linen, and counterfeit cash
 * you have." Distinct from ~print, which actually runs the press.
 */
const MATERIALS = [
    { id: 'ink', label: 'Ink', emoji: '📼' },
    { id: 'cotton', label: 'Cotton', emoji: '☁️' },
    { id: 'linen', label: 'Linen', emoji: '📜' },
    { id: 'counterfeit_cash', label: 'Counterfeit Cash', emoji: '💵' },
] as const;

const command: Command = {
    name: 'printer',
    description: 'Displays your printer and how much ink, cotton, linen, and counterfeit cash you have.',
    usage: '~printer',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;

        const printers = await getInventoryItem(userId, 'printer');

        if (printers < 1n) {
            message.reply("You don't have a printer! `~bm`");
            return;
        }

        const lines: string[] = [];
        for (const mat of MATERIALS) {
            const amount = await getInventoryItem(userId, mat.id);
            lines.push(`${mat.emoji} **${mat.label}** | ${formatBigNumber(amount)}`);
        }

        const embed = new EmbedBuilder()
            .setTitle(`${userTag(message)}'s Printer`)
            .setDescription(
                `\`~print <stacks>\` to print counterfeit cash\n` +
                `🖨️ **Printers** | ${formatBigNumber(printers)}\n\n` +
                lines.join('\n')
            )
            .setColor(getUserColor(userId));

        message.reply({ embeds: [embed] });
    },
};

export default command;
