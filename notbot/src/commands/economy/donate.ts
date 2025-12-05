import { Message, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { Command } from '../../handlers/commandHandler';
import { getUserColor } from '../../database/userColor';

const command: Command = {
    name: 'donate',
    description: 'Purchase Credit',
    execute: async (message: Message, args: string[], client: Client) => {
        const embed = new EmbedBuilder()
            .setTitle('Purchasing 💎 Credit')
            .setDescription(
                '1. Select an amount you wish to purchase by clicking one of the buttons below\n' +
                '📄 - Each 💎 **Credit** is equal to **$1.00 USD**\n' +
                '2. Once selected, a new private message will appear with your checkout link.\n' +
                '   Open it up and pay for your cart.\n' +
                '3. Once your purchase has been processed, it will automatically be added to your\n' +
                '   `~dbal`. Enjoy!\n\n' +
                '⚠️ By purchasing anything on our store you agree to the [Terms of Service](https://example.com) and [Purchase Policies](https://example.com). If you\'re experiencing issues join the [Support Server](https://example.com) (`~support`) and contact support via the support channel.'
            )
            .setColor(getUserColor(message.author.id));

        const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder().setCustomId('donate_5').setLabel('💎 5').setStyle(ButtonStyle.Secondary).setEmoji('💎'),
                new ButtonBuilder().setCustomId('donate_10').setLabel('💎 10').setStyle(ButtonStyle.Secondary).setEmoji('💎'),
                new ButtonBuilder().setCustomId('donate_25').setLabel('💎 25').setStyle(ButtonStyle.Secondary).setEmoji('💎'),
                new ButtonBuilder().setCustomId('donate_50').setLabel('💎 50').setStyle(ButtonStyle.Secondary).setEmoji('💎'),
                new ButtonBuilder().setCustomId('donate_100').setLabel('💎 100').setStyle(ButtonStyle.Secondary).setEmoji('💎'),
            );

        message.reply({ embeds: [embed], components: [row] });
    },
};

export default command;
