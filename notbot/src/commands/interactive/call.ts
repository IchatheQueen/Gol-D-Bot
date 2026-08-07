import { Message, Client, EmbedBuilder } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';
import { updatePetStats, isPetDead } from '../../utils/petUtils';

const command: Command = {
    name: 'call',
    description: 'Call the Mindless Titans to aid your Spirit (Feed Pill Alias)',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;

        // Verify user has 'pill'
        const invCheck = await db.execute({
            sql: 'SELECT amount FROM inventory WHERE user_id = ? AND item_id = ?',
            args: [userId, 'pill']
        });
        const amountStr = (invCheck.rows[0] as any)?.amount;
        const amount = parseInt(amountStr || '0');

        if (amount <= 0) {
            message.reply('You do not have any **Pills** from your generator!');
            return;
        }

        // Fetch Pet
        const pet = await updatePetStats(userId);
        if (!pet) {
            message.reply('You don\'t have a Spirit to call! Use `~pet`.');
            return;
        }

        if (isPetDead(pet)) {
            message.reply('Your Spirit is dead. Use Medicine.');
            return;
        }

        // Generator Check
        const genCheck = await db.execute({ sql: 'SELECT * FROM generators WHERE user_id = ?', args: [userId] });
        if (genCheck.rows.length === 0) {
            message.reply('You need a Generator to use this power.');
            return;
        }

        const gen = genCheck.rows[0] as any;

        // Calculate Buffs (Matching feed.ts logic)
        // 🖤 Health (12 * HealthLvl)
        // 🍷 Thirst (15 * ThirstLvl)
        // 💀 Hunger (9 * HungerLvl)
        // 🔥 Energy (12 * EnergyLvl)

        const healthBuff = 12 * gen.health_level;
        const thirstBuff = 15 * gen.thirst_level;
        const hungerBuff = 9 * gen.hunger_level;
        const energyBuff = 12 * gen.energy_level;

        // Passive usage (Strength/Agi etc also apply likely, but only mentioned 4 stats in screenshot)
        const strengthBuff = gen.strength_level;
        const agiBuff = gen.agility_level;
        const intBuff = gen.intellect_level;
        const endBuff = gen.endurance_level;

        // Apply Update
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

        // Deduct Pill
        await db.execute({
            sql: 'UPDATE inventory SET amount = amount - 1 WHERE user_id = ? AND item_id = ?',
            args: [userId, 'pill']
        });

        // "x (@user) [Lvl 25] Spirit has let out a shriek and called the other Mindless Titans to come shield and protect it, allowing it to rest and regain 🖤 12, 🍷 15, 💀 9, and 🔥 12"
        const embed = new EmbedBuilder()
            .setDescription(`${message.author.username} (${message.author}) [Lvl ${pet.level}] ${pet.name} has let out a shriek and called the other Mindless Titans to come shield and protect it, allowing it to rest and regain 🖤 ${healthBuff}, 🍷 ${thirstBuff}, 💀 ${hungerBuff}, and 🔥 ${energyBuff}`)
            .setColor('#2b2d31');

        message.reply({ embeds: [embed] });
    },
};

export default command;
