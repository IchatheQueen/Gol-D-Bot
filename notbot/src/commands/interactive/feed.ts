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
        const cooldownRow = await db.execute({
            sql: 'SELECT timestamp FROM cooldowns WHERE user_id = ? AND command = ?',
            args: [userId, 'feed']
        });
        if (cooldownRow.rows.length > 0) {
            const lastFed = Number(cooldownRow.rows[0].timestamp);
            const cooldownTime = 1 * 60 * 60 * 1000;
            if (now - lastFed < cooldownTime) {
                const diff = cooldownTime - (now - lastFed);
                const minutes = Math.ceil(diff / 60000);
                message.reply(`Your pet is still full! Wait **${minutes} minutes** before feeding it again.`);
                return;
            }
        }

        // Resolve Item
        let itemId = '';
        if (foodQuery === 'p' || foodQuery === 'pill') itemId = 'pill';
        else if (foodQuery === 'c' || foodQuery === 'cat_pill') itemId = 'cat_pill';
        else if (foodQuery === 'beer') itemId = 'beer';
        else if (foodQuery === 'energy drink') itemId = 'energy_drink';
        else if (foodQuery === 'coffee') itemId = 'coffee';
        else if (foodQuery === 'opioid') itemId = 'opioid';
        else if (foodQuery === 'steroid') itemId = 'steroid';
        else if (foodQuery === 'medicine') itemId = 'medicine';

        if (!itemId) {
            message.reply('Usage: `~feed <food>` (e.g., beer, medicine, pill)');
            return;
        }

        // Check Inventory
        const invCheck = await db.execute({
            sql: 'SELECT amount FROM inventory WHERE user_id = ? AND item_id = ?',
            args: [userId, itemId]
        });
        const amount = invCheck.rows[0] ? BigInt(invCheck.rows[0].amount as string) : 0n;

        if (amount <= 0n) {
            message.reply(`You do not have any **${items[itemId]?.name || foodQuery}**!`);
            return;
        }

        // Fetch Pet (with decay updates)
        const pet = await updatePetStats(userId);
        if (!pet) return;

        // Check if dead
        if (isPetDead(pet) && itemId !== 'medicine' && itemId !== 'pill' && itemId !== 'cat_pill') {
            message.reply('Your cat is dead 💀. You must feed it **Medicine**, **Pills**, or **Cat Pills** to revive it!');
            return;
        }

        // Consume Item
        await db.execute({
            sql: 'UPDATE inventory SET amount = (CAST(amount AS INTEGER) - 1) WHERE user_id = ? AND item_id = ?',
            args: [userId, itemId]
        });

        let restoreMsg = '';
        const itemEmoji = resolveEmoji(client, items[itemId]?.emoji || '📦');

        if (itemId === 'pill') {
            const genCheck = await db.execute({ sql: 'SELECT * FROM generators WHERE user_id = ?', args: [userId] });
            if (genCheck.rows.length === 0) {
                message.reply('You need a Pill Generator to see the effects of this pill!');
                return;
            }
            const gen = genCheck.rows[0] as any;
            const healthBuff = 12 * gen.health_level;
            const hungerBuff = 9 * gen.hunger_level;
            const thirstBuff = 15 * gen.thirst_level;
            const energyBuff = 12 * gen.energy_level;

            await db.execute({
                sql: `UPDATE pets SET 
                       hunger = MIN(100, hunger + ?),
                       thirst = MIN(100, thirst + ?),
                       energy = MIN(100, energy + ?),
                       health = MIN(max_health, health + ?)
                       WHERE user_id = ?`,
                args: [hungerBuff, thirstBuff, energyBuff, healthBuff, userId]
            });
            restoreMsg = `restored hunger, thirst, energy, and health`;
        } else if (itemId === 'cat_pill') {
            await db.execute({
                sql: 'UPDATE pets SET thirst = MIN(100, thirst + 8), energy = MIN(100, energy + 20) WHERE user_id = ?',
                args: [userId]
            });
            restoreMsg = `restored 💧 8 and 🔋 20 as well as doubled its intellect & strength for an hour`;
        } else if (itemId === 'medicine') {
            await db.execute({
                sql: 'UPDATE pets SET health = MIN(max_health, health + 250) WHERE user_id = ?',
                args: [userId]
            });
            restoreMsg = `restored 💖 250`;
        } else if (itemId === 'beer') {
            await db.execute({
                sql: 'UPDATE pets SET thirst = MIN(100, thirst + 20) WHERE user_id = ?',
                args: [userId]
            });
            restoreMsg = `restored 💧 20 but they look a bit wobbly`;
        } else if (itemId === 'energy_drink') {
            await db.execute({
                sql: 'UPDATE pets SET thirst = MAX(0, thirst - 65), energy = 100 WHERE user_id = ?',
                args: [userId]
            });
            restoreMsg = `restored 🔋 100 but they are now very thirsty`;
        } else if (itemId === 'coffee') {
            await db.execute({
                sql: 'UPDATE pets SET thirst = MIN(100, thirst + 8), energy = MIN(100, energy + 20) WHERE user_id = ?',
                args: [userId]
            });
            restoreMsg = `restored 💧 8 and 🔋 20`;
        }

        // Set Cooldown
        await db.execute({
            sql: 'INSERT OR REPLACE INTO cooldowns (user_id, command, timestamp) VALUES (?, ?, ?)',
            args: [userId, 'feed', now]
        });

        const displayName = message.guild?.members.cache.get(userId)?.displayName || message.author.username;
        const embed = new EmbedBuilder()
            .setDescription(`${displayName} (@${message.author.username}) has fed their [Lvl ${pet.level}] Cat a ${itemEmoji} and ${restoreMsg}`)
            .setColor('#2b2d31');

        message.reply({ embeds: [embed] });
    },
};

export default command;
