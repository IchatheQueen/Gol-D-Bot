import { Message, Client, EmbedBuilder } from 'discord.js';
import { resolveEmoji } from '../../utils/resolveEmoji';
import { items } from '../../data/items';
import { Command } from '../../handlers/commandHandler';
import { getUserColor } from '../../database/userColor';

const command: Command = {
    name: 'pub',
    description: 'View the Pub',
    execute: async (message: Message, args: string[], client: Client) => {
        const embedPub = new EmbedBuilder()
            .setTitle('🍺 | The Pub')
            .setDescription('`~buy <id> <amount>` to buy an item\n👁️ Hint: The id is the number in brackets next to the item! E.g: [ID: 1] is 1')
            .setColor(getUserColor(message.author.id));

        // The Bar
        let barContent = '';
        barContent += `[ID: 1] 🎫 **Bar Membership** - Price: 💵 100,000\n   └ Buy a membership and treat yourself to some of the best beers in town\n`;
        barContent += `[ID: 2] 🍺 **Beer** - Price: 💵 10,000\n   └ Order a nice refreshing stein of beer\n`;
        barContent += `[3] 💵 **9,000** - Price: 🍺 1\n   └ Don't like your beer? You can sell it back to us for a 90% refund\n`;

        embedPub.addFields({ name: 'The Bar', value: barContent });

        // Stuff
        let stuffContent = '';
        stuffContent += `[ID: 4] 🕵️ **Ender** - Price: 🍺 6\n   └ Kidnap an EnderMomandNate and receive Ender briefcases daily (~collect ender)\n`;
        stuffContent += `[ID: 5] 💎 **Miner's Capsule** - Price: 💎 0.20\n   └ A chance to win big with some useful commands (~vault help)\n`;

        embedPub.addFields({ name: 'Stuff', value: stuffContent });

        const embedArmory = new EmbedBuilder()
            .setTitle('🔫 | The Armory')
            .setColor(getUserColor(message.author.id));

        // Weapons & Ammo Logic
        const pistolBullet = items['6'];
        const crossbow = items['7'];
        const arrow = items['8'];
        const rifle = items['9'];
        const rifleBullet = items['10'];
        const speaker = items['11'];
        const flamethrower = items['12'];
        const propane = items['13'];

        let weaponsContent = '';
        weaponsContent += `👁️ Hint: After selecting a weapon, use \`~shoot <target>\` to attack your foe!\n`;
        weaponsContent += `[ID: 7] ${resolveEmoji(client, crossbow.emoji || '🏹')} **${crossbow.name}** - Price: 🍺 ${crossbow.price.toLocaleString()}\n   └ ${crossbow.description}\n`;
        weaponsContent += `[ID: 9] ${resolveEmoji(client, rifle.emoji)} **${rifle.name}** - Price: 🍺 ${rifle.price.toLocaleString()}\n   └ ${rifle.description}\n`;
        weaponsContent += `[ID: 11] ${resolveEmoji(client, speaker.emoji || '📢')} **${speaker.name}** - Price: 🍺 ${speaker.price.toLocaleString()}\n   └ ${speaker.description}\n`;
        weaponsContent += `[ID: 12] ${resolveEmoji(client, flamethrower.emoji)} **${flamethrower.name}** - Price: 🍺 ${flamethrower.price.toLocaleString()}\n   └ ${flamethrower.description}\n`;

        let ammoContent = '';
        ammoContent += `[ID: 6] ${resolveEmoji(client, pistolBullet.emoji)} **${pistolBullet.name}** - Price: 🍺 ${pistolBullet.price}\n   └ ${pistolBullet.description}\n`;
        ammoContent += `[ID: 8] ${resolveEmoji(client, arrow.emoji)} **${arrow.name}** - Price: 🍺 ${arrow.price.toLocaleString()}\n   └ ${arrow.description}\n`;
        ammoContent += `[ID: 10] ${resolveEmoji(client, rifleBullet.emoji)} **${rifleBullet.name}** - Price: 🍺 ${rifleBullet.price.toLocaleString()}\n   └ ${rifleBullet.description}\n`;
        ammoContent += `[ID: 13] ${resolveEmoji(client, propane.emoji || '🛢️')} **${propane.name}** - Price: 🍺 ${propane.price.toLocaleString()}\n   └ ${propane.description}\n`;

        embedArmory.addFields(
            { name: 'Weapons', value: weaponsContent },
            { name: 'Ammunition', value: ammoContent }
        );

        message.reply({ embeds: [embedPub, embedArmory] });
    },
};

export default command;
