import { Message, Client, EmbedBuilder } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';
import { getUser, updateUser } from '../../database/economy';
import { addInventoryItem } from '../../database/inventory';
import { formatBigNumber } from '../../utils/bigNumbers';
import { items } from '../../data/items';

const command: Command = {
    name: 'allpossiblebeer',
    description: 'Spend all your money on beer',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;

        // Screenshot implies it might be used like "~buy 2 allpossiblebeer" which is weird for a command name.
        // User said "allpossiblebeer takes all of your money and turns it in to beer".
        // Use standard structure.

        const user = await getUser(userId);
        const beerPrice = items['beer']?.price || 500n; // Default if not found

        if (user.balance < beerPrice) {
            message.reply('You cannot afford even a single beer!');
            return;
        }

        // Calculate max beer
        const maxBeer = user.balance / beerPrice;

        // Deduct all money (or cost of max beer)
        const cost = maxBeer * beerPrice;
        await updateUser(userId, { balance: user.balance - cost });

        // Add beer
        await addInventoryItem(userId, 'beer', maxBeer);

        // Screenshot Output: "@User has successfully ordered 🍺 9,99... digits! Enjoy :3"
        const embed = new EmbedBuilder()
            .setDescription(`${message.author} has successfully ordered 🍺 ${formatBigNumber(maxBeer)}! Enjoy :3`)
            .setColor('#E91E63'); // Magenta bar as seen

        message.reply({ embeds: [embed] });
    }
};

export default command;
