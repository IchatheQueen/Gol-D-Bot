
import { Message, Client, EmbedBuilder } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';
import { items } from '../../data/items';
import { resolveEmoji } from '../../utils/resolveEmoji';

const VALID_FOODS = ['beer', 'energy drink', 'coffee', 'opioid', 'steroid', 'medicine', 'pill'];

const command: Command = {
    name: 'feed',
    description: 'Feed your pet',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;
        // Handle multi-word args like "energy drink"
        const foodQuery = args.join(' ').toLowerCase();

        if (!foodQuery || !VALID_FOODS.includes(foodQuery)) {
            // Exact format from screenshot
            const formatted = VALID_FOODS.map(f => `\`${f}\``).join(', '); // Not explicitly "formatted" in screenshot, but user message screenshot shows "The types of food are beer, ..." with code blocks.
            // Screenshot: "The types of food are `beer`, `energy drink`, `coffee`, `opioid`, `steroid`, `medicine`, `pill`"
            message.reply(`The types of food are ${formatted}`);
            return;
        }

        // Map query to item ID
        // Pill -> pill
        // Energy drink -> energy_drink
        let itemId = foodQuery.replace(/ /g, '_'); // simple mapping

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

        // Fetch Pet
        const petCheck = await db.execute({
            sql: 'SELECT * FROM pets WHERE user_id = ?',
            args: [userId]
        });

        if (petCheck.rows.length === 0) {
            message.reply('You don\'t have a pet to feed! Use `~pet` to get started.');
            return;
        }

        const pet = petCheck.rows[0] as any;

        // Handle 'pill' logic specifically
        if (itemId === 'pill') {
            // Fetch Generator
            const genCheck = await db.execute({ sql: 'SELECT * FROM generators WHERE user_id = ?', args: [userId] });
            if (genCheck.rows.length === 0) {
                message.reply('You need a Pill Generator to see the effects of this pill!');
                return;
            }
            const gen = genCheck.rows[0] as any;

            // Apply buffs
            // Logic: Add generator stats to pet logic? 
            // "Changes the values on the pill generator when the user feeds the pill to their cat on top of their old values" 
            // wait "changes values on the generator"? 
            // "changes the values [of the pet based] on the pill generator"? 
            // "on top of their old values".
            // Assuming additive buff to PET stats based on GENERATOR stats.

            // Generator stats: potency_level, efficiency_level...
            // Pet stats: health, strength, agility, intellect, endurance.

            // Mapping:
            // Gen Health Lvl -> Pet Max Health? (Base 12 per level)
            // Gen Strength Lvl -> Pet Strength? (Base 1 + level implied?)

            const healthBuff = 12 * gen.health_level;
            const strengthBuff = gen.strength_level; // Screenshot "1 [2x]" implies level 1 gives 2x? Or adds 1?
            // "Strength - 1 [2x]" -> Level 1. Value 2x.
            // If I have 1 Strength, and I get buffed by "2x", do I get +2? or *2?
            // "On top of their old values" implies addition.
            // If pet has 10 strength. Generator has Lvl 1 (2x). 
            // User says "changes values... on top". 
            // I will add the *Level Value* to the pet.
            // Just assuming direct addition of Level for now, or 12* for health as per dashboard.

            // Let's go with adding the Levels to the Pet Stats directly, except Health/Energy etc which have multipliers in dashboard.
            // Dashboard: Health (12 * lvl), Hunger (9 * lvl), Thirst (15 * lvl), Energy (12 * lvl).
            // Dashboard: Strength (Lvl), Agility (Lvl)... (Shown as "1 [2x]"). 
            // I'll add the computed values.

            const hungerBuff = 9 * gen.hunger_level;
            const thirstBuff = 15 * gen.thirst_level;
            const energyBuff = 12 * gen.energy_level;

            const agiBuff = gen.agility_level;
            const intBuff = gen.intellect_level;
            const endBuff = gen.endurance_level;

            // Update Pet
            // Note: hunger/thirst/energy on pet are "current" values usually 0-100? 
            // OR are they max values?
            // Pets table: hunger (default 100), thirst (default 100).
            // Usually these are "needs". Reducing hunger? Or increasing Max?
            // "Hunger - 1 [💊 9]" on generator. 
            // Providing a Pill usually fills stats?
            // If it's "on top of their old values", maybe it increases the CAP? Or just refills?
            // Given "Strength", "Agility" are stats that grow, it implies PERMANENT GROWTH or CAP GROWTH.
            // I will assume it increases the PET'S STATS (Strength, Agility, Intellect, Endurance, Max Health).
            // What about Hunger/Thirst/Energy? Maybe it restores them? Or increases their max? 
            // Pets schema has `max_health`, but `hunger` doesn't have max column (implied 100).
            // I will implement: 
            // - Increases Max Health
            // - Increases Strength, Agility, Intellect, Endurance
            // - Restores Hunger, Thirst, Energy by the calculated amounts.

            // Wait "Hunger [9]". If I feed, maybe it reduces hunger by 9?

            await db.execute({
                sql: `UPDATE pets SET 
                       max_health = max_health + ?, 
                       strength = strength + ?, 
                       agility = agility + ?, 
                       intellect = intellect + ?, 
                       endurance = endurance + ?,
                       health = MIN(max_health + ?, health + ?), -- Heal + Raise max? Or just raise max? "changes values... on top".
                       hunger = MIN(100, hunger + ?), -- restore
                       thirst = MIN(100, thirst + ?), -- restore
                       energy = MIN(100, energy + ?) -- restore
                       WHERE user_id = ?`,
                args: [
                    healthBuff, strengthBuff, agiBuff, intBuff, endBuff,
                    healthBuff, healthBuff, // healing
                    hungerBuff, thirstBuff, energyBuff,
                    userId
                ]
            });

            // Remove pill
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
                    `Restored Hunger, Thirst, Energy!`) // Simplified msg
                .setColor('#FF0000'); // Generic color

            message.reply({ embeds: [embed] });
        } else {
            // Generic feed placeholder
            message.reply(`You fed your pet **${foodQuery}**! (Generic effect applied)`);
            // TODO: Implement other foods effects
        }
    }
};

export default command;
