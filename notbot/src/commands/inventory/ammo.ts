import { Message, Client, EmbedBuilder } from 'discord.js';
import { getInventory } from '../../database/inventory';
import { Command } from '../../handlers/commandHandler';

const command: Command = {
    name: 'ammo',
    description: 'Check your ammo',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;

        const inventory = await getInventory(userId);

        const arrows = inventory.find(i => i.item_id === 'arrows')?.amount || 0n;
        const pistol = inventory.find(i => i.item_id === 'pistol_bullets')?.amount || 0n;
        const rifle = inventory.find(i => i.item_id === 'rifle_bullets')?.amount || 0n;
        const propane = inventory.find(i => i.item_id === 'propane')?.amount || 0n;

        const embed = new EmbedBuilder()
            .setTitle(`@${message.author.username}'s Ammo`)
            .setDescription(
                `🏹 **Arrows** | ${arrows.toLocaleString()}\n` +
                `🔫 **Pistol Bullets** | ${pistol.toLocaleString()}\n` +
                `<:rifle:1445995242317942874> **Rifle Bullets** | ${rifle.toLocaleString()}\n` +
                `⛽ **Propane** | ${propane.toLocaleString()}`
            )
            .setColor('#2f3136');

        message.reply({ embeds: [embed] });
    },
};

export default command;
