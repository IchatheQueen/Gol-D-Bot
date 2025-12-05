import { Message, Client, EmbedBuilder } from 'discord.js';
import { getInventory } from '../../database/inventory';
import { Command } from '../../handlers/commandHandler';

const command: Command = {
    name: 'briefcases',
    description: 'Check your briefcases',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;

        const inventory = await getInventory(userId);

        const employee = inventory.find(i => i.item_id === 'employee_briefcase')?.amount || 0n;
        const richkid = inventory.find(i => i.item_id === 'richkid_briefcase')?.amount || 0n;
        const oldlady = inventory.find(i => i.item_id === 'oldlady_briefcase')?.amount || 0n;
        const nitro = inventory.find(i => i.item_id === 'nitro_briefcase')?.amount || 0n;
        const ender = inventory.find(i => i.item_id === 'ender_briefcase')?.amount || 0n;

        const embed = new EmbedBuilder()
            .setTitle(`@${message.author.username}'s Briefcases`)
            .setDescription(
                `💼 **Employee** | ${employee.toLocaleString()}\n` +
                `💼 **Rich Kid** | ${richkid.toLocaleString()}\n` +
                `👜 **Old Lady** | ${oldlady.toLocaleString()}\n` +
                `🚀 **Nitro** | ${nitro.toLocaleString()}\n` +
                `🔮 **Ender** | ${ender.toLocaleString()}`
            )
            .setColor('#2f3136');

        message.reply({ embeds: [embed] });
    },
};

export default command;
