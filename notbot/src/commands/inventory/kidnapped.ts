import { Message, Client, EmbedBuilder } from 'discord.js';
import { getInventoryItem } from '../../database/inventory';
import { Command } from '../../handlers/commandHandler';

const command: Command = {
    name: 'kidnapped',
    description: 'Check your kidnapped Enders',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;

        const count = await getInventoryItem(userId, 'endermomandnates');

        const embed = new EmbedBuilder()
            .setTitle(`${message.author.username.toUpperCase()} (@${message.author.tag})'s Kidnapped`)
            .setDescription(
                `\`~collect <type>\` to collect briefcases from your pool of kidnapped\n\n` +
                `😂 **EnderMomandNates** | ${count.toLocaleString()}... (${count.toString().length} digits)`
            )
            .setColor('#2f3136');

        message.reply({ embeds: [embed] });
    },
};

export default command;
