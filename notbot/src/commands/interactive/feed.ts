import { Message, Client, EmbedBuilder } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';
import { items } from '../../data/items';
import { resolveEmoji } from '../../utils/resolveEmoji';
import { updatePetStats, isPetDead } from '../../utils/petUtils';

const VALID_FOODS = ['beer', 'energy drink', 'coffee', 'opioid', 'steroid', 'medicine', 'pill', 'p', 'c', 'cat_pill'];

const command: Command = {
    name: 'feed',
    description: 'Feed your pet',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;
        const foodQuery = args.join(' ').toLowerCase();

        // Check active feed cooldown FIRST to match screenshot behavior "ignoring you"
        const petCheck = await db.execute({ sql: 'SELECT * FROM pets WHERE user_id = ?', args: [userId] });
        if (petCheck.rows.length === 0) {
            message.reply('You don\'t have a pet to feed! Use `~pet` to get started.');
            return;
        }
        const petData = petCheck.rows[0] as any;

        // Check cooldown
        const now = Date.now();
        const cooldownTime = 1 * 60 * 60 * 1000; // 1 hour (Default, reduced by pet/patreon?)
        // Screenshot implies there is a wait time.
        // Assuming 'last_fed' column exists or similar. The migration `add_last_fed_to_pets` was mentioned.
        // I need to ensure that column exists or use a cooldown table.
        // Let's check if 'last_fed' exists in `petData`.
        // If not, I might need to add it or use a separate table.
        // For now, I'll assume a `feed_cooldown` or similar in `pets` or `cooldowns` table.
        // The `pet.ts` command mentioned "reduced its feeding cooldown".
        // Let's use `cooldowns` table to consistency with `hex`.

        const cooldownRow = await db.execute({
            sql: 'SELECT timestamp FROM cooldowns WHERE user_id = ? AND command = ?',
            args: [userId, 'feed']
        });

        if (cooldownRow.rows.length > 0) {
            const lastUsed = Number((cooldownRow.rows[0] as any).timestamp);
            const timeLeft = lastUsed + cooldownTime - now;

            if (timeLeft > 0) {
                const hours = Math.floor(timeLeft / (1000 * 60 * 60));
                const minutes = Math.ceil((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

                const embed = new EmbedBuilder()
                    .setDescription(`Your [Lvl ${petData.level || 0}] Cat is ignoring you. It might be best to wait another ${hours} hours and ${minutes} minutes before approaching it with food again\n\nReduce your feed cooldown and much more with 🪙 **Gold** (~patreon)!`)
                    .setColor('#FFA500'); // Orange-ish, check screenshot color later if needed (looks somewhat dark/gold bar on left)

                message.reply({ embeds: [embed] });
                return;
            }
        }

        if (!foodQuery || !VALID_FOODS.includes(foodQuery)) {
            const displayFoods = VALID_FOODS.filter(f => f.length > 2); // Filter out short aliases like 'p', 'c'
            const formatted = displayFoods.map(f => `\`${f}\``).join(', ');
            message.reply(`The types of food are ${formatted}`);
            return;
        }

        let itemId = foodQuery.replace(/ /g, '_');
        if (itemId === 'c') itemId = 'coffee'; // Alias
        if (itemId === 'p') itemId = 'pill'; // Alias

        // Verify user has item
        const invCheck = await db.execute({
            sql: 'SELECT amount FROM inventory WHERE user_id = ? AND item_id = ?',
            args: [userId, itemId]
        });

        const amountStr = (invCheck.rows[0] as any)?.amount;
        const amount = parseInt(amountStr || '0');

        if (amount <= 0) {
            message.reply(`You do not have any **${items[itemId]?.name || foodQuery}**!`);
            return;
        }

        // Fetch Pet (with decay updates)
        const pet = await updatePetStats(userId);

        if (!pet) return; // Should be handled above

        // Check if dead (Block everything except Medicine and Pills)
        if (isPetDead(pet) && itemId !== 'medicine' && itemId !== 'pill' && itemId !== 'cat_pill') {
            message.reply('Your cat is dead 💀. You must feed it **Medicine**, **Pills**, or **Cat Pills** to revive it!');
            return;
        }

        // Apply Feeding Logic
        if (itemId === 'pill') {
            const genCheck = await db.execute({ sql: 'SELECT * FROM generators WHERE user_id = ?', args: [userId] });
            if (genCheck.rows.length === 0) {
                message.reply('You need a Pill Generator to see the effects of this pill!');
                return;
            }
            const gen = genCheck.rows[0] as any;
            const healthBuff = 12 * gen.health_level;
            const strengthBuff = gen.strength_level;
            const hungerBuff = 9 * gen.hunger_level;
            const thirstBuff = 15 * gen.thirst_level;
            const energyBuff = 12 * gen.energy_level;
            const agiBuff = gen.agility_level;
            const intBuff = gen.intellect_level;
            const endBuff = gen.endurance_level;

            await db.execute({
                sql: `UPDATE pets SET 
                       max_health = max_health + ?, 
                       strength = strength + ?, 
                       agility = agility + ?, 
                       intellect = intellect + ?, 
                       endurance = endurance + ?,
                       health = MIN(max_health + ?, health + ?),
                       hunger = MIN(100, hunger + ?),
                       thirst = MIN(100, thirst + ?),
                       energy = MIN(100, energy + ?)
                       WHERE user_id = ?`,
                args: [
                    healthBuff, strengthBuff, agiBuff, intBuff, endBuff,
                    healthBuff, healthBuff,
                    hungerBuff, thirstBuff, energyBuff,
                    userId
                ]
            });

            const embed = new EmbedBuilder()
                .setTitle('💊 Pill Consumed')
                .setDescription(`Your pet ate a **Pill**!\n` +
                    `**+${healthBuff}** Max Health\n` +
                    `**+${strengthBuff}** Strength\n` +
                    `**+${agiBuff}** Agility\n` +
                    `**+${intBuff}** Intellect\n` +
                    `**+${endBuff}** Endurance\n` +
                    `Restored Hunger, Thirst, Energy!`)
                .setColor('#FF0000');

            if (isPetDead(pet)) {
                embed.setDescription(`Your pet ate a **Pill** and has been **Revived**! 🧟\n` +
                    `**+${healthBuff}** Health`);
            }

            message.reply({ embeds: [embed] });
        }
        else if (itemId === 'beer') {
            await db.execute({
                sql: 'UPDATE pets SET thirst = MIN(100, thirst + 20) WHERE user_id = ?',
                args: [userId]
            });
            const expires = Date.now() + 2 * 60 * 60 * 1000;
            await db.execute({
                sql: 'INSERT OR REPLACE INTO drug_effects (user_id, drug_type, expires_at) VALUES (?, ?, ?)',
                args: [userId, 'alcohol', expires]
            });
            message.reply('You gave your pet a **Beer**! 🍺\nThirst +20. Your pet looks a bit wobbly (Intellect/Agility halved for 2h).');
        } else if (itemId === 'energy_drink') {
            await db.execute({
                sql: 'UPDATE pets SET thirst = MAX(0, thirst - 65), energy = 100 WHERE user_id = ?',
                args: [userId]
            });
            message.reply('You gave your pet an **Energy Drink**! ⚡\nEnergy fully restored! But they look thirsty (-65 Thirst).');
        } else if (itemId === 'coffee') {
            await db.execute({
                sql: 'UPDATE pets SET thirst = MIN(100, thirst + 8), energy = MIN(100, energy + 20) WHERE user_id = ?',
                args: [userId]
            });
            message.reply('You gave your pet some **Coffee**! ☕\nThirst +8, Energy +20.');
        } else if (itemId === 'medicine') {
            if (isPetDead(pet)) {
                await db.execute({
                    sql: 'UPDATE pets SET health = 100, energy = 50, hunger = 50, thirst = 50 WHERE user_id = ?',
                    args: [userId]
                });
                message.reply('You revived your cat with **Medicine**! 🩹\nIt feels much better.');
            } else {
                await db.execute({
                    sql: 'UPDATE pets SET health = MIN(max_health, health + 250) WHERE user_id = ?',
                    args: [userId]
                });
                message.reply('You gave your pet **Medicine**! 🩹\nHealed 250 Health.');
            }
        } else if (itemId === 'opioid') {
            await db.execute({
                sql: 'UPDATE pets SET health = MIN(max_health, health + 50) WHERE user_id = ?',
                args: [userId]
            });
            const expires = Date.now() + 1 * 60 * 60 * 1000; // 1h
            await db.execute({
                sql: 'INSERT OR REPLACE INTO drug_effects (user_id, drug_type, expires_at) VALUES (?, ?, ?)',
                args: [userId, 'opioid', expires]
            });
            message.reply('You gave your pet an **Opioid**! 💊\nHealed 50 Health. They seem sluggish...');
        } else if (itemId === 'steroid') {
            await db.execute({
                sql: 'UPDATE pets SET strength = strength + 1, health = MAX(0, health - 10) WHERE user_id = ?',
                args: [userId]
            });
            message.reply('You gave your pet a **Steroid**! 💪\n**+1 Strength**! But it took a toll on their health (-10 HP).');
        } else if (itemId === 'cat_pill') {
            if (isPetDead(pet)) {
                await db.execute({
                    sql: 'UPDATE pets SET health = 100, thirst = 100, energy = 100, hunger = 50 WHERE user_id = ?',
                    args: [userId]
                });
                message.reply('You revived your cat with a **Cat Pill**! 💊\nIt feels much better and is full of energy!');
            } else {
                await db.execute({
                    sql: 'UPDATE pets SET thirst = MIN(100, thirst + 8), energy = MIN(100, energy + 20), intellect = intellect * 2, strength = strength * 2 WHERE user_id = ?',
                    args: [userId]
                });
                const expires = Date.now() + 1 * 60 * 60 * 1000;
                await db.execute({
                    sql: 'INSERT OR REPLACE INTO drug_effects (user_id, drug_type, expires_at) VALUES (?, ?, ?)',
                    args: [userId, 'cat_pill_boost', expires]
                });
                message.reply('You gave your pet a **Cat Pill**! 💊\nrestored 💧 8 and 🔋 20 as well as doubled its intellect & strength for an hour');
            }
        } else {
            message.reply(`You fed your pet **${foodQuery}**!`);
        }

        // Deduct Item
        await db.execute({
            sql: 'UPDATE inventory SET amount = amount - 1 WHERE user_id = ? AND item_id = ?',
            args: [userId, itemId]
        });

        // Set Cooldown (Only if successful)
        await db.execute({
            sql: 'INSERT OR REPLACE INTO cooldowns (user_id, command, timestamp) VALUES (?, ?, ?)',
            args: [userId, 'feed', now]
        });
    },
};

export default command;
