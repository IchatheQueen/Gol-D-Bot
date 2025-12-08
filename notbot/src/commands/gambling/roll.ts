import { Message, Client, EmbedBuilder, ColorResolvable } from 'discord.js';
import { getUser, updateUser } from '../../database/economy';
import { Command } from '../../handlers/commandHandler';
import { getUserColor } from '../../database/userColor';
import { parseBigNumber, formatBigNumber } from '../../utils/bigNumbers';
import { resolveEmoji } from '../../utils/resolveEmoji';

const command: Command = {
    name: 'roll',
    description: 'Roll dice and gamble',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;
        const user = await getUser(userId);

        // Parse bet amount
        const betArg = args[0];
        if (!betArg) {
            message.reply('Usage: `~roll <bet>` - Roll 2 dice. Higher total wins!');
            return;
        }

        const bet = parseBigNumber(betArg) ?? 0n;
        if (bet <= 0n) {
            message.reply('Bet must be greater than 0!');
            return;
        }

        if (bet > user.balance) {
            message.reply(`You don't have enough money! Balance: 💵 ${formatBigNumber(user.balance)}`);
            return;
        }

        // Roll dice for player and house
        const playerDice1 = Math.floor(Math.random() * 6) + 1;
        const playerDice2 = Math.floor(Math.random() * 6) + 1;
        const playerTotal = playerDice1 + playerDice2;

        const houseDice1 = Math.floor(Math.random() * 6) + 1;
        const houseDice2 = Math.floor(Math.random() * 6) + 1;
        const houseTotal = houseDice1 + houseDice2;

        // Dice emoji mapping
        const diceEmoji: Record<number, string> = {
            1: '⚀', 2: '⚁', 3: '⚂', 4: '⚃', 5: '⚄', 6: '⚅'
        };

        let resultText = '';
        let color: ColorResolvable = getUserColor(userId);
        let winnings = 0n;

        const pD1 = resolveEmoji(client, `dice_${playerDice1}`, diceEmoji[playerDice1]);
        const pD2 = resolveEmoji(client, `dice_${playerDice2}`, diceEmoji[playerDice2]);
        const hD1 = resolveEmoji(client, `dice_${houseDice1}`, diceEmoji[houseDice1]);
        const hD2 = resolveEmoji(client, `dice_${houseDice2}`, diceEmoji[houseDice2]);

        if (playerTotal > houseTotal) {
            // Player wins - 2x bet
            winnings = bet;
            await updateUser(userId, { balance: user.balance + winnings });
            resultText = `**Your Roll**: ${pD1} ${pD2} (**${playerTotal}**)\n**House Roll**: ${hD1} ${hD2} (**${houseTotal}**)\n\n**Result:** 🎉 **YOU WIN!**\n**Won:** 💵 ${formatBigNumber(winnings)}`;
            color = '#00ff00'; // Green
        } else if (playerTotal < houseTotal) {
            // House wins
            await updateUser(userId, { balance: user.balance - bet });
            resultText = `**Your Roll**: ${pD1} ${pD2} (**${playerTotal}**)\n**House Roll**: ${hD1} ${hD2} (**${houseTotal}**)\n\n**Result:** 😢 **YOU LOSE!**\n**Lost:** 💵 ${formatBigNumber(bet)}`;
            color = '#ff0000'; // Red
        } else {
            // Tie - push (no money changes)
            resultText = `**Your Roll**: ${pD1} ${pD2} (**${playerTotal}**)\n**House Roll**: ${hD1} ${hD2} (**${houseTotal}**)\n\n**Result:** 🤝 **TIE!**\n**Push** - Bet returned!`;
            color = '#ffff00'; // Yellow
        }

        const embed = new EmbedBuilder()
            .setTitle('🎲 Dice Roll')
            .setDescription(resultText)
            .setColor(color as any);

        message.reply({ embeds: [embed] });
    },
};

export default command;
