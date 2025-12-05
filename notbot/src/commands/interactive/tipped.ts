import { Message, Client, EmbedBuilder } from 'discord.js';
import { updateUser, getUser } from '../../database/economy';
import { Command } from '../../handlers/commandHandler';
import { items } from '../../data/items';

const command: Command = {
    name: 'tipped',
    description: 'Select a tipped arrow for your crossbow',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;
        const arrowName = args[0]?.toLowerCase();

        if (!arrowName) {
            message.reply('Usage: `~tipped <type>`\nAvailable: normal, slime, armorshred, slow, nitro');
            return;
        }

        // Map common names/aliases
        const arrowMap: { [key: string]: string } = {
            'normal': 'arrow_normal',
            'slime': 'arrow_slime',
            'armorshred': 'arrow_armorshred',
            'armor': 'arrow_armorshred',
            'shred': 'arrow_armorshred',
            'slow': 'arrow_slow',
            'slowness': 'arrow_slow',
            'nitro': 'arrow_nitro'
        };

        const arrowId = arrowMap[arrowName];

        if (!arrowId) {
            message.reply('Invalid arrow type! Available: normal, slime, armorshred, slow, nitro');
            return;
        }

        // Check inventory for arrow (except normal which we assume is default/buyable easily, but let's enforce ownership if it's an item)
        // Actually, "tipped arrows can be found from briefcases".
        // So user must have them.
        // Normal arrow is default? "this can be obtained from the ~shop".
        // Let's assume they need to own at least 1 to select it, OR just select it and check ammo on shoot.
        // Usually select just sets preference. Check ammo on shoot.

        updateUser(userId, { selected_arrow: arrowId });

        const embed = new EmbedBuilder()
            .setTitle('🏹 Arrow Selected')
            .setDescription(`You have equipped **${items[arrowId].name}** for your Crossbow!`)
            .setColor('#00ff00');

        message.reply({ embeds: [embed] });
    },
};

export default command;
