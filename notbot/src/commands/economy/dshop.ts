import { Message, Client, EmbedBuilder } from 'discord.js';
import { Command } from '../../handlers/commandHandler';
import { getUserColor } from '../../database/userColor';
import { resolveEmoji } from '../../utils/resolveEmoji';

const command: Command = {
    name: 'dshop',
    description: 'View the Premium Shop',
    execute: async (message: Message, args: string[], client: Client) => {
        // Donator credit uses a custom server emoji. Bind it once with
        // `~setemoji dcred <:name:id>` rather than hardcoding a unicode stand-in.
        const dc = resolveEmoji(client, 'dcred', '💚');

        const embed = new EmbedBuilder()
            .setTitle(`${dc} Premium Shop`)
            .setDescription('`~dcred` to check your available credit\n`~dbuy <id>` to purchase an item\n`~dinfo` for details on purchasable items\n`~ditems` to check the items you already possess')
            .setColor(getUserColor(message.author.id));

        // Packages
        let packages = '';
        packages += `[1] 🛠️ **Essentials Package** (Conjuror + Statistician) - ${dc} 4 (save ${dc} 1)\n`;
        packages += `[2] 🤩 **OG Package** (Conjuror + Investor + Statistician) - ${dc} 9 (save ${dc} 3)\n`;
        packages += `[3] 🕵️ **No-lifer's Package** (OG Package + Junkie) - ${dc} 14 (save ${dc} 4)\n`;
        packages += `[4] 🎩 **Gentlemen's Package** (Junkie + Investor + Seagull) - ${dc} 13 (save ${dc} 7)\n`;
        packages += `[5] 💪 **Flexer's Package** (Everything but addons) - ${dc} 17 (save ${dc} 8)\n`;
        embed.addFields({ name: 'Packages', value: packages });

        // Items
        let items = '';
        items += `[6] 📈 **Statistician** - ${dc} 2\n`;
        items += `[7] 💧 **Conjuror** - ${dc} 3\n`;
        items += `[8] 🚬 **Junkie** - ${dc} 6\n`;
        items += `[9] 💰 **Investor** - ${dc} 7\n`;
        items += `[10] 🕊️ **Seagull** - ${dc} 7\n`;
        items += `[11] 🟡 **GoldBot Gold** (Duration: 30 Days) - ${dc} 5\n`;

        embed.addFields({ name: 'Items', value: items });


        // Addons
        let addons = '';
        addons += `[12] ⤴️ **Top Donor Role** - ${dc} 7\n`;
        addons += `[13] 👶 **Recruit** - ${dc} 15\n`;
        addons += `[custom_role_token] 🎟️ **Custom Role Token** - ${dc} 5\n`;
        addons += `[auto_feeder] 🦾 **Auto-Feeder** - ${dc} 10\n`;
        embed.addFields({ name: 'Addons', value: addons });

        // Cosmetic Market
        embed.addFields({ name: '🐱 Cosmetic Market', value: 'Spice up your gameplay cosmetically with different cat skins, weapon skins and more via the `~market`!' });

        message.reply({ embeds: [embed] });
    },
};

export default command;
