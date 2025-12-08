import { Message, Client, EmbedBuilder } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';
import { items } from '../../data/items';
import { resolveEmoji } from '../../utils/resolveEmoji';
import { updatePetStats, isPetDead } from '../../utils/petUtils';

const VALID_FOODS = ['beer', 'energy drink', 'coffee', 'opioid', 'steroid', 'medicine', 'pill'];

const command: Command = {
    name: 'feed',
    description: 'Feed your pet',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;
        const foodQuery = args.join(' ').toLowerCase();

        if (!foodQuery || !VALID_FOODS.includes(foodQuery)) {
            const formatted = VALID_FOODS.map(f => `\`${f}\``).join(', ');
            message.reply(`The types of food are ${formatted}`);
            return;
        }

        let itemId = foodQuery.replace(/ /g, '_');

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

        if (!pet) {
            message.reply('You don\'t have a pet to feed! Use `~pet` to get started.');
            return;
        }

        // Check if dead (Block everything except Medicine)
        if (isPetDead(pet) && itemId !== 'medicine') {
            message.reply('Your cat is dead 💀. You must feed it **Medicine** to revive it!');
            return;
        }

        if (itemId === 'pill') {
            // ... (Pill Logic - keeping existing)
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

            await db.execute({
                sql: 'UPDATE inventory SET amount = amount - 1 WHERE user_id = ? AND item_id = ?',
                args: [userId, itemId]
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

            message.reply({ embeds: [embed] });
        } else if (itemId === 'beer') {
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
                // Revive Logic
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

            // Opioid: Health +50 (Heal), Agility Debuff?
            // Let's say Heal 50, and 'opioid' drug effect (maybe reduces agility in logic?)
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
            // Steroid: Strength +1 (Permanent?), Health -10 (Damage)
            await db.execute({
                sql: 'UPDATE pets SET strength = strength + 1, health = MAX(0, health - 10) WHERE user_id = ?',
                args: [userId]
            });
            message.reply('You gave your pet a **Steroid**! 💪\n**+1 Strength**! But it took a toll on their health (-10 HP).');
        } else {
            message.reply(`You fed your pet **${foodQuery}**!`);
        }

        if (itemId !== 'pill') {
            // Deduct item implementation for non-pills
            await db.execute({
                sql: 'UPDATE inventory SET amount = amount - 1 WHERE user_id = ? AND item_id = ?',
                args: [userId, itemId]
            });
        }
    }
};

export default command;
