import { Message, Client, EmbedBuilder } from 'discord.js';
import db from '../../database/db';
import { getUser, updateUser } from '../../database/economy';
import { Command } from '../../handlers/commandHandler';
import { getInventoryItem, removeInventoryItem } from '../../database/inventory';
import { formatBigNumber } from '../../utils/bigNumbers';

const command: Command = {
    name: 'attack',
    description: 'Attack another user with your cat',
    execute: async (message: Message, args: string[], client: Client) => {
        const target = message.mentions.users.first();
        const targetId = target ? target.id : args[0];

        if (!targetId) {
            message.reply('Who do you want to attack?');
            return;
        }

        if (targetId === message.author.id) {
            message.reply('You cannot attack yourself.');
            return;
        }

        const attackerPetStmt = await db.execute({
            sql: 'SELECT * FROM pets WHERE user_id = ?',
            args: [message.author.id]
        });
        let attackerPet = attackerPetStmt.rows[0] as any;

        if (!attackerPet) {
            message.reply('You need a cat to attack! Use `~cat` to adopt one.');
            return;
        }

        if (attackerPet.energy < 5) {
            message.reply('Your cat is too tired to attack!');
            return;
        }

        if (attackerPet.is_attacking) {
            message.reply('Your cat is already attacking! Use `~retreat` to stop.');
            return;
        }

        // Set attacking state
        await db.execute({
            sql: 'UPDATE pets SET is_attacking = 1 WHERE user_id = ?',
            args: [message.author.id]
        });

        // Initial message
        const initialEmbed = new EmbedBuilder()
            .setDescription(`**${message.author.username}'s [Lvl ${attackerPet.level}] ${attackerPet.name}** has flown at <@${targetId}> and consumed 🔋 0`)
            .setColor('#FF0000');
        await (message.channel as any).send({ embeds: [initialEmbed] });

        const flavorTexts = [
            "slashed at",
            "simultaneously slammed both wings into",
            "sunk its beak deep into",
            "viciously scratched"
        ];

        // Attack Loop
        while (true) {
            // Refresh pet state to check for retreat or energy changes
            const petCheck = await db.execute({
                sql: 'SELECT * FROM pets WHERE user_id = ?',
                args: [message.author.id]
            });
            attackerPet = petCheck.rows[0] as any;

            if (!attackerPet.is_attacking) {
                // Retreat was called
                break;
            }

            if (attackerPet.energy < 5) {
                const tiredEmbed = new EmbedBuilder()
                    .setDescription(`**${message.author.username}'s [Lvl ${attackerPet.level}] ${attackerPet.name}** is too tired to continue and has returned.`)
                    .setColor('#FF0000');
                await (message.channel as any).send({ embeds: [tiredEmbed] });

                await db.execute({
                    sql: 'UPDATE pets SET is_attacking = 0 WHERE user_id = ?',
                    args: [message.author.id]
                });
                break;
            }

            // Deduct energy
            await db.execute({
                sql: 'UPDATE pets SET energy = energy - 5 WHERE user_id = ?',
                args: [message.author.id]
            });

            // Determine target (Balance or Item)
            const targetItem = attackerPet.target_item || 'balance';
            let actionText = "";

            if (targetItem === 'balance' || targetItem === 'bal') {
                const currentTarget = await getUser(targetId);
                // BigInt math: destroy 1-5% of balance
                // Random percentage between 1% and 5% = balance * (1 to 5) / 100
                const randomPct = BigInt(Math.floor(Math.random() * 5) + 1);
                const destroyAmount = (currentTarget.balance * randomPct) / 100n;

                if (destroyAmount > 0n) {
                    await updateUser(targetId, { balance: currentTarget.balance - destroyAmount });
                }

                const flavor = flavorTexts[Math.floor(Math.random() * flavorTexts.length)];
                if (flavor.includes("sunk its beak")) {
                    actionText = `${flavor} <@${targetId}>'s flesh and twisted, destroying 💵 ${formatBigNumber(destroyAmount)}`;
                } else if (flavor.includes("slammed")) {
                    actionText = `${flavor} <@${targetId}>, knocking the wind out of them and destroyed 💵 ${formatBigNumber(destroyAmount)}`;
                } else {
                    actionText = `${flavor} <@${targetId}> and destroyed 💵 ${formatBigNumber(destroyAmount)}`;
                }
            } else {
                // Item targeting
                // Check if user has item
                const itemId = targetItem.toLowerCase().replace(/ /g, '_');
                const itemAmount = await getInventoryItem(targetId, itemId);

                if (itemAmount > 0n) {
                    // Destroy 1 item
                    await removeInventoryItem(targetId, itemId, 1n);
                    actionText = `slashed at <@${targetId}> and destroyed 1x **${targetItem}**`;
                } else {
                    actionText = `slashed at <@${targetId}> but found no **${targetItem}** to destroy`;
                }
            }

            const attackEmbed = new EmbedBuilder()
                .setDescription(`**${message.author.username}'s [Lvl ${attackerPet.level}] ${attackerPet.name}** has ${actionText}; 🔋 5 have been consumed`)
                .setColor('#FF0000');
            await (message.channel as any).send({ embeds: [attackEmbed] });

            // Wait 2 seconds between hits
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    },
};

export default command;
