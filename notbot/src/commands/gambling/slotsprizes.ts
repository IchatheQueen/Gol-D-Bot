import { Message, Client, EmbedBuilder } from 'discord.js';
import { Command } from '../../handlers/commandHandler';

const command: Command = {
    name: 'slotsprizes',
    description: 'View slot machine prize table',
    execute: async (message: Message, args: string[], client: Client) => {
        const embed = new EmbedBuilder()
            .setTitle('🎰 Slots Prizes')
            .setDescription(
                `[ 🍒 🍒 🍒 ] - bet x 2000\n` +
                `[ 🍉 🍉 🍉 ] - bet x 300\n` +
                `[ 2x 🍊 ] - bet x 120\n` +
                `[ 💰 💰 💰 ] - bet x 90\n` +
                `[ 🍋 🍋 🍋 ] - bet x 40\n` +
                `[ 🐟 🐟 🐟 ] - bet x 20\n` +
                `[ 3x 🌽 🌽 ] - bet x 15\n` +
                `[ 1x 🍊 ] - bet x 12\n` +
                `[ 3x 🍇 ] - bet x 12\n` +
                `[ 2x 🍇 ] - bet x 6\n` +
                `[ 1x 🍇 ] - bet x 3\n` +
                `[ 0x ⬛ ] - bet x 2\n` +
                `[ ⬜ ⬜ ⬜ ] - bet x 1`
            )
            .setColor('#2f3136');

        message.reply({ embeds: [embed] });
    },
};

export default command;
