import { Message, Client, EmbedBuilder } from 'discord.js';
import { items } from '../../data/items';
import { Command } from '../../handlers/commandHandler';
import { getUserColor } from '../../database/userColor';

const command: Command = {
    name: 'pub',
    description: 'View the Pub',
    execute: async (message: Message, args: string[], client: Client) => {
        const embed = new EmbedBuilder()
            .setTitle('🍺 | The Pub')
            .setDescription('`~buy <id> <amount>` to buy an item\n👁️ Hint: The id is the number in brackets next to the item! E.g: [ID: 1] is 1')
            .setColor(getUserColor(message.author.id));

        // The Bar
        let barContent = '';
        barContent += `[ID: 1] 🎫 **Bar Membership** - Price: 💵 100,000\n   └ Buy a membership and treat yourself to some of the best beers in town\n`;
        barContent += `[ID: 2] 🍺 **Beer** - Price: 💵 10,000\n   └ Order a nice refreshing stein of beer\n`;
        barContent += `[3] 💵 **9,000** - Price: 🍺 1\n   └ Don't like your beer? You can sell it back to us for a 90% refund\n`;

        embed.addFields({ name: 'The Bar', value: barContent });

        // Stuff
        let stuffContent = '';
        stuffContent += `[ID: 4] 🕵️ **Ender** - Price: 🍺 6\n   └ Kidnap an EnderMomandNate and receive Ender briefcases daily (~collect ender)\n`;
        stuffContent += `[ID: 5] 💎 **Miner's Capsule** - Price: 💎 0.20\n   └ A chance to win big with some useful commands (~vault help)\n`;

        embed.addFields({ name: 'Stuff', value: stuffContent });

        // Weapons
        let weaponsContent = '';
        weaponsContent += `👁️ Hint: After selecting a weapon, use \`~shoot <target>\` to attack your foe!\n`;
        weaponsContent += `[ID: 6] 🔫 **Pistol Bullet** - Price: 🍺 1\n   └ Ammunition for pistols (All players have one! \`~select pistol\`)\n`;
        weaponsContent += `[ID: 7] 🏹 **Crossbow** - Price: 🍺 20,000\n   └ Select this weapon with \`~select crossbow\` (Starts with 3 Shots!)\n`;
        weaponsContent += `[ID: 8] 🏹 **Arrow** - Price: 🍺 1,500\n   └ Ammunition for crossbows\n`;
        weaponsContent += `[ID: 9] <:rifle:1445995242317942874> **Rifle** - Price: 🍺 27,000,000,000,000\n   └ Select this weapon with \`~select rifle\`\n`;
        weaponsContent += `[ID: 10] <:rifle:1445995242317942874> **Rifle Bullet** - Price: 🍺 3,000,000,000,000\n   └ Ammunition for rifles\n`;
        weaponsContent += `[ID: 11] 📢 **Speaker** - Price: 🍺 400,000,000,000,000\n   └ Shatters beer and knocks people unconscious (\`~select speaker\`)\n`;
        weaponsContent += `[ID: 12] 🔥 **Flamethrower** - Price: 🍺 100,000,000,000,000,000,000\n   └ Burns others' crops but knocks you unconscious as well in the process (\`~select flame\`)\n`;
        weaponsContent += `[ID: 13] 🛢️ **Propane** - Price: 🍺 1,500,000,000,000,000,000\n   └ Ammunition for flamethrowers\n`;

        embed.addFields({ name: 'Weapons', value: weaponsContent });

        message.reply({ embeds: [embed] });
    },
};

export default command;
