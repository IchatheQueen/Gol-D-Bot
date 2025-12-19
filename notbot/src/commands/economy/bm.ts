import { Message, Client, EmbedBuilder } from 'discord.js';
import { blackMarketItems } from '../../data/blackMarketItems';
import { Command } from '../../handlers/commandHandler';
import { getUserColor } from '../../database/userColor';
import { resolveEmoji } from '../../utils/resolveEmoji';
import { formatBigNumber } from '../../utils/bigNumbers';

const command: Command = {
    name: 'bm',
    description: 'View the Black Market',
    aliases: ['blackmarket'],
    execute: async (message: Message, args: string[], client: Client) => {
        const displayName = message.guild?.members.cache.get(message.author.id)?.displayName || message.author.username;
        const drugs = '[ID: **10**] 💊 **Pill** - Price: 💵 **1Q**\n└ Used to grow your cat\n' +
            '[ID: **11**] 💉 **Cat Pill** - Price: 💵 **2Q**\n└ Grow your cat even more!\n' +
            '[ID: **5**] 🧬 **DNA** - Price: 💵 **50Q**\n└ Change your cats appearance';
        const drugsCont = '[ID: **12**] 🍭 **LSD** - Price: 💵 **50Q**\n└ Makes your cat and you go on a trip';
        const farming = '[ID: **100**] 💧 **Water** - Price: 💵 **500B**\n└ Water your crops\n' +
            '[ID: **101**] 💩 **Fertilizer** - Price: 💵 **1T**\n└ Make them grow faster';
        const counterfeit = '[ID: **200**] 📜 **Counterfeit Paper** - Price: 🌿 **50**\n└ Paper for counterfeit cash\n' +
            '[ID: **201**] ☁️ **Special Ink** - Price: 🌿 **100**\n└ Ink for counterfeit cash';

        const embed = new EmbedBuilder()
            .setTitle('🕵️ | SlotBot Black Market')
            .setDescription('`~exch <id> <amount>` to make a trade\n⚠️ Be careful! This shop may scam you!\n👁️ Hint: The id is the number in brackets next to the item! E.g: [ID: 1] is 1')
            .setColor('#2b2d31');

        embed.addFields(
            { name: 'Drugs', value: drugs },
            { name: 'Drugs (Cont.)', value: drugsCont },
            { name: 'Farming', value: farming },
            { name: 'Counterfeit', value: counterfeit }
        );

        message.reply({ embeds: [embed] });
    },
};

export default command;
