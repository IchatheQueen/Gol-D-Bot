import { Message, Client, EmbedBuilder } from 'discord.js';
import { resolveEmoji } from '../../utils/resolveEmoji';
import { items } from '../../data/items';
import { getInventory } from '../../database/inventory';
import { Command } from '../../handlers/commandHandler';
import { getUserColor } from '../../database/userColor';

const command: Command = {
    name: 'ammo',
    description: 'Check your ammo',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;

        const inventory = await getInventory(userId);

        const arrows = inventory.find(i => i.item_id === '8')?.amount || 0n;
        const pistol = inventory.find(i => i.item_id === '6')?.amount || 0n;
        const rifle = inventory.find(i => i.item_id === '10')?.amount || 0n;
        const propane = inventory.find(i => i.item_id === '13')?.amount || 0n;

        const arrowDef = items['8'];
        const pistolDef = items['6'];
        const rifleDef = items['10'];
        const propaneDef = items['13'];

        const embed = new EmbedBuilder()
            .setTitle(`${message.author.displayName} (@${message.author.username})'s Ammunition`)
            .setDescription(
                `\`~shoot <user>\` to use up your ammo\n` +
                `\`~tipped\` to see your tipped arrows\n\n` +
                `${resolveEmoji(client, arrowDef.emoji)} **${arrowDef.name}s** | ${arrows.toLocaleString()}\n` +
                `${resolveEmoji(client, pistolDef.emoji)} **${pistolDef.name}s** | ${pistol.toLocaleString()}\n` +
                `${resolveEmoji(client, rifleDef.emoji)} **${rifleDef.name}s** | ${rifle.toLocaleString()}\n` +
                `${resolveEmoji(client, propaneDef.emoji)} **${propaneDef.name}** | ${propane.toLocaleString()}`
            )
            .setColor('#2b2d31');

        message.reply({ embeds: [embed] });
    },
};

export default command;
