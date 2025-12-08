import { Message, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js';
import { getUser, updateUser } from '../../database/economy';
import { Command } from '../../handlers/commandHandler';
import { parseBigNumber, formatBigNumber } from '../../utils/bigNumbers';

const suits = ['♠', '♥', '♦', '♣'];
const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

interface Card {
    suit: string;
    value: string;
    weight: number;
}

const getDeck = (): Card[] => {
    const deck: Card[] = [];
    for (const suit of suits) {
        for (const value of values) {
            let weight = parseInt(value);
            if (value === 'J' || value === 'Q' || value === 'K') weight = 10;
            if (value === 'A') weight = 11;
            deck.push({ suit, value, weight });
        }
    }
    return deck.sort(() => Math.random() - 0.5);
};

const getHandValue = (hand: Card[]): number => {
    let value = 0;
    let aces = 0;
    for (const card of hand) {
        value += card.weight;
        if (card.value === 'A') aces++;
    }
    while (value > 21 && aces > 0) {
        value -= 10;
        aces--;
    }
    return value;
};

const command: Command = {
    name: 'blackjack',
    description: 'Play blackjack',
    aliases: ['bj'],
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

        // Deduct bet initially
        await updateUser(message.author.id, { balance: user.balance - bet });

        const deck = getDeck();
        const playerHand = [deck.pop()!, deck.pop()!];
        const dealerHand = [deck.pop()!, deck.pop()!];

        const generateEmbed = (gameOver: boolean) => {
            const playerValue = getHandValue(playerHand);
            const dealerValue = getHandValue(dealerHand);

            // Format cards with space: "2 ♠"
            const formatHand = (hand: Card[]) => hand.map(c => `${c.value} ${c.suit}`).join('  ');

            const embed = new EmbedBuilder()
                .setTitle('♠ | Blackjack')
                .setColor(gameOver ? (playerValue > 21 ? '#ff0000' : (dealerValue > 21 || playerValue > dealerValue ? '#00ff00' : (playerValue === dealerValue ? '#ffff00' : '#ff0000'))) : '#00FFFF')
                .addFields(
                    {
                        name: `GoldBot's cards (${gameOver ? dealerValue : '??'})`,
                        value: gameOver ? formatHand(dealerHand) : `????????`,
                        inline: false
                    },
                    {
                        name: `.${message.author.username}'s cards (${playerValue})`,
                        value: formatHand(playerHand),
                        inline: false
                    }
                );

            if (!gameOver) {
                embed.setFooter({ text: 'Hit or Stand to continue • Closest to 21 wins!' });
            }

            return embed;
        };

        const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder().setCustomId('hit').setLabel('Hit').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('stand').setLabel('Stand').setStyle(ButtonStyle.Secondary)
            );

        const reply = await message.reply({ embeds: [generateEmbed(false)], components: [row] });

        const collector = reply.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60000 });

        collector.on('collect', async (i) => {
            if (i.user.id !== message.author.id) {
                i.reply({ content: 'This is not your game!', ephemeral: true });
                return;
            }

            if (i.customId === 'hit') {
                playerHand.push(deck.pop()!);
                const value = getHandValue(playerHand);

                if (value > 21) {
                    await i.update({ embeds: [generateEmbed(true).setDescription(`Bust! You lost $${formatBigNumber(bet)}`)], components: [] });
                    collector.stop();
                } else {
                    await i.update({ embeds: [generateEmbed(false)], components: [row] });
                }
            } else if (i.customId === 'stand') {
                let dealerValue = getHandValue(dealerHand);
                while (dealerValue < 17) {
                    dealerHand.push(deck.pop()!);
                    dealerValue = getHandValue(dealerHand);
                }

                const playerValue = getHandValue(playerHand);
                let result = '';
                let winnings = 0n;

                if (dealerValue > 21) {
                    result = `Dealer busts! You won $${formatBigNumber(bet * 2n)}`;
                    winnings = bet * 2n;
                } else if (dealerValue > playerValue) {
                    result = `Dealer wins! You lost $${formatBigNumber(bet)}`;
                } else if (playerValue > dealerValue) {
                    result = `You win! You won $${formatBigNumber(bet * 2n)}`;
                    winnings = bet * 2n;
                } else {
                    result = `Push! Money returned.`;
                    winnings = bet;
                }

                if (winnings > 0n) {
                    const updatedUser = await getUser(message.author.id);
                    await updateUser(message.author.id, { balance: updatedUser.balance + winnings });
                }

                await i.update({ embeds: [generateEmbed(true).setDescription(result)], components: [] });
                collector.stop();
            }
        });

        collector.on('end', (collected, reason) => {
            if (reason === 'time') {
                reply.edit({ content: 'Game timed out.', components: [] });
            }
        });
    },
};

export default command;
