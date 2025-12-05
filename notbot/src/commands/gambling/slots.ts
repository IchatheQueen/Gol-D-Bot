import { Message, Client, EmbedBuilder } from 'discord.js';
import { getUser, updateUser } from '../../database/economy';
import { Command } from '../../handlers/commandHandler';
import { parseBigNumber, formatBigNumber } from '../../utils/bigNumbers';

const slots = ['🍒', '🍋', '🍇', '🍉', '🔔', '💎'];

const command: Command = {
    name: 'slots',
    description: 'Play the slot machine',
    aliases: ['slot'],
    execute: async (message: Message, args: string[], client: Client) => {
        const user = await getUser(message.author.id);
        const betStr = args[0];

        if (!betStr) {
            message.reply('Please specify an amount to bet.');
            return;
        }

        let bet = 0n;
        if (betStr.toLowerCase() === 'all') {
            bet = user.balance;
        } else {
            bet = parseBigNumber(betStr) || 0n;
        }

        if (bet <= 0n) {
            message.reply('Please specify a valid bet amount.');
            return;
        }

        if (user.balance < bet) {
            message.reply('You do not have enough money.');
            return;
        }

        // Deduct bet
        await updateUser(message.author.id, { balance: user.balance - bet });

        // Spin
        const result = [
            slots[Math.floor(Math.random() * slots.length)],
            slots[Math.floor(Math.random() * slots.length)],
            slots[Math.floor(Math.random() * slots.length)],
        ];

        let winnings = 0n;
        let messageText = 'You lost!';

        if (result[0] === result[1] && result[1] === result[2]) {
            winnings = bet * 10n;
            messageText = `Jackpot! You won $${formatBigNumber(winnings)}!`;
        } else if (result[0] === result[1] || result[1] === result[2] || result[0] === result[2]) {
            winnings = bet * 2n;
            messageText = `Two of a kind! You won $${formatBigNumber(winnings)}!`;
        }

        if (winnings > 0n) {
            const updatedUser = await getUser(message.author.id);
            await updateUser(message.author.id, { balance: updatedUser.balance + winnings });
        }

        const embed = new EmbedBuilder()
            .setTitle('🎰 Slots 🎰')
            .setDescription(`**[ ${result.join(' | ')} ]**\n\n${messageText}`)
            .setColor(winnings > 0n ? '#00ff00' : '#ff0000');

        message.reply({ embeds: [embed] });
    },
};

export default command;
