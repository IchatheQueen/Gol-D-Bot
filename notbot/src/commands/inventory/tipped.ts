import { Message, Client, EmbedBuilder } from 'discord.js';
import { getInventory } from '../../database/inventory';
import { Command } from '../../handlers/commandHandler';

const command: Command = {
    name: 'tipped',
    description: 'Check your tipped arrows',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;

        const inventory = await getInventory(userId);

        const normal = inventory.find(i => i.item_id === 'tipped_normal')?.amount || 999910n;
        const nitro = inventory.find(i => i.item_id === 'tipped_nitro')?.amount || 0n;
        const armorshred = inventory.find(i => i.item_id === 'tipped_armorshred')?.amount || 80n;
        const slime = inventory.find(i => i.item_id === 'tipped_slime')?.amount || 162n;
        const slowness = inventory.find(i => i.item_id === 'tipped_slowness')?.amount || 11n;

        const embed = new EmbedBuilder()
            .setTitle(`@${message.author.username}'s Tipped Arrows`)
            .setDescription(
                `Obtain tipped variants from different briefcases via \`~steal\`.\n` +
                `Equip a tipped arrow type with \`~tipped <type>\`\n` +
                `**Currently Equipped:** 🏹 Normal\n\n` +
                `**Tipped Collection**\n` +
                `🏹 **Normal** | ${normal.toLocaleString()}\n` +
                `└ Normal tipped arrows have no special effects!\n` +
                `🏹 **Nitro** | ${nitro.toLocaleString()}\n` +
                `└ Chance to stun the target and bypass geese protections.\n` +
                `└ ◉ Support Server Booster Perk\n` +
                `🏹 **Armorshred** | ${armorshred.toLocaleString()}\n` +
                `└ Deals damage to your opponent's goose when they are on protect\n` +
                `🏹 **Slime** | ${slime.toLocaleString()}\n` +
                `└ Chance to stun your opponent\n` +
                `🏹 **Slowness** | ${slowness.toLocaleString()}\n` +
                `└ Applies a stack of ☠️ Chained and 10% to apply another`
            )
            .setColor('#2f3136');

        message.reply({ embeds: [embed] });
    },
};

export default command;
