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

        // Calculate Result
        const result = [
            slots[Math.floor(Math.random() * slots.length)],
            slots[Math.floor(Math.random() * slots.length)],
            slots[Math.floor(Math.random() * slots.length)],
        ];

        // Initial Message (Spinning)
        const embed = new EmbedBuilder()
            .setTitle('🎰 Slots 🎰')
            .setDescription('**[ ❓ | ❓ | ❓ ]**\n\nSpinning...')
            .setColor('#ffff00'); // Yellow for spinning

        const sentMessage = await message.reply({ embeds: [embed] });

        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        try {
            // Reel 1
            await delay(1000);
            embed.setDescription(`**[ ${result[0]} | ❓ | ❓ ]**\n\nSpinning...`);
            await sentMessage.edit({ embeds: [embed] });

            // Reel 2
            await delay(1000);
            embed.setDescription(`**[ ${result[0]} | ${result[1]} | ❓ ]**\n\nSpinning...`);
            await sentMessage.edit({ embeds: [embed] });

            // Reel 3 (Final)
            await delay(1000);

            let winnings = 0n;
            let messageText = 'You lost!';
            let color = '#ff0000'; // Red for loss

            if (result[0] === result[1] && result[1] === result[2]) {
                winnings = bet * 10n;
                messageText = `Jackpot! You won $${formatBigNumber(winnings)}!`;
                color = '#00ff00'; // Green
            } else if (result[0] === result[1] || result[1] === result[2] || result[0] === result[2]) {
                winnings = bet * 2n;
                messageText = `Two of a kind! You won $${formatBigNumber(winnings)}!`;
                color = '#00ff00'; // Green
            }

            if (winnings > 0n) {
                const updatedUser = await getUser(message.author.id);
                // Re-fetch user to get latest balance in case of race conditions, though less likely here
                // We already have `user`, but `updatedUser` logic was correct.
                // Re-calculating balance:
                const latestUser = await getUser(message.author.id);
                await updateUser(message.author.id, { balance: latestUser.balance + winnings });
            }

            embed.setDescription(`**[ ${result.join(' | ')} ]**\n\n${messageText}`)
                .setColor(color as any); // Type cast for safety

            await sentMessage.edit({ embeds: [embed] });
        } catch (error) {
            console.error('Error executing slots animation:', error);
            // If animation fails, ensure we at least show the result one last time
            message.channel.send(`**Slots Result:** [ ${result.join(' | ')} ]`);
        }
    },
},
};

export default command;
