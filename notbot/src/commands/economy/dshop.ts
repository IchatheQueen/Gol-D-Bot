import { Message, Client, EmbedBuilder } from 'discord.js';
import { Command } from '../../handlers/commandHandler';
import { getUserColor } from '../../database/userColor';

const command: Command = {
    name: 'dshop',
    description: 'View the Premium Shop',
    execute: async (message: Message, args: string[], client: Client) => {
        const embed = new EmbedBuilder()
            .setTitle('💎 Premium Shop')
            .setDescription('`~dcred` to check your available credit\n`~dbuy <id>` to purchase an item\n`~dinfo` for details on purchasable items\n`~ditems` to check the items you already possess')
            .setColor(getUserColor(message.author.id));

        // Packages
        let packages = '';
        packages += `[1] 🛠️ **Essentials Package** (Conjuror + Statistician) - 💎 4 (save 💎 1)\n`;
        packages += `[2] 🤩 **OG Package** (Conjuror + Investor + Statistician) - 💎 9 (save 💎 3)\n`;
        packages += `[3] 🕵️ **No-lifer's Package** (OG Package + Junkie) - 💎 14 (save 💎 4)\n`;
        packages += `[4] 🎩 **Gentlemen's Package** (Junkie + Investor + Seagull) - 💎 13 (save 💎 7)\n`;
        packages += `[5] 💪 **Flexer's Package** (Everything but addons) - 💎 17 (save 💎 8)\n`;
        embed.addFields({ name: 'Packages', value: packages });

        // Items
        let items = '';
        items += `[6] 📈 **Statistician** - 💎 2\n`;
        items += `[7] 💧 **Conjuror** - 💎 3\n`;
        items += `[8] 🚬 **Junkie** - 💎 6\n`;
        items += `[9] 💰 **Investor** - 💎 7\n`;
        items += `[10] 🕊️ **Seagull** - 💎 7\n`;

        embed.addFields({ name: 'Items', value: items });


        // Addons
        let addons = '';
        addons += `[12] ⤴️ **Top Donor Role** - 💎 7\n`;
        addons += `[13] 👶 **Recruit** - 💎 15\n`;
        addons += `[custom_role_token] 🎟️ **Custom Role Token** - 💎 5\n`;
        addons += `[auto_feeder] 🦾 **Auto-Feeder** - 💎 10\n`;
        embed.addFields({ name: 'Addons', value: addons });

        // Cosmetic Market
        embed.addFields({ name: '🐱 Cosmetic Market', value: 'Spice up your gameplay cosmetically with different cat skins, weapon skins and more via the `~market`!' });

        message.reply({ embeds: [embed] });
    },
};

export default command;
