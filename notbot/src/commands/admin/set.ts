import { Message, Client } from 'discord.js';
import db from '../../database/db';
import { getUser, updateUser } from '../../database/economy';
import { Command } from '../../handlers/commandHandler';
import { parseBigNumber, formatBigNumber } from '../../utils/bigNumbers';
import { isAdmin } from '../../utils/adminUtils';

const command: Command = {
    name: 'set',
    description: 'Admin command to set user or cat stats',
    execute: async (message: Message, args: string[], client: Client) => {
        if (!await isAdmin(message.author.id)) {
            return;
        }

        const targetUser = message.mentions.users.first();
        const targetId = targetUser ? targetUser.id : args[0];
        const category = args[1]?.toLowerCase();

        if (!targetId || !category) {
            message.reply('Usage: `~set <@user> <cat|bal|vault> <values>`');
            return;
        }

        if (category === 'cat') {
            // Format: ~set @user cat level;hunger;thirst;energy;health;experience;cat_credits;strength;agility;intellect;endurance;metabolism
            const statsString = args[2];
            if (!statsString) {
                message.reply('Usage: `~set <@user> cat <level;hunger;thirst;energy;health;experience;credits;strength;agility;intellect;endurance;metabolism>`');
                return;
            }

            const statParts = statsString.split(';');
            if (statParts.length !== 12) {
                message.reply(`Expected 12 values separated by semicolons, got ${statParts.length}.\nOrder: level;hunger;thirst;energy;health;experience;credits;strength;agility;intellect;endurance;metabolism`);
                return;
            }

            // Using parseBigNumber for each part to ensure consistency, though parseInt would also work for simple numbers
            const stats = statParts.map(v => Number(parseBigNumber(v) || 0n));
            const [level, hunger, thirst, energy, health, experience, credits, strength, agility, intellect, endurance, metabolism] = stats;

            // Check if pet exists
            const petCheck = await db.execute({
                sql: 'SELECT * FROM pets WHERE user_id = ?',
                args: [targetId]
            });
            const pet = petCheck.rows[0];
            if (!pet) {
                message.reply(`User doesn't have a cat!`);
                return;
            }

            // Update all cat stats at once
            await db.execute({
                sql: `
                UPDATE pets SET 
                    level = ?, 
                    hunger = ?, 
                    thirst = ?, 
                    energy = ?, 
                    health = ?,
                    experience = ?, 
                    credits = ?, 
                    strength = ?, 
                    agility = ?, 
                    intellect = ?, 
                    endurance = ?,
                    metabolism = ?
                WHERE user_id = ?
            `,
                args: [level, hunger, thirst, energy, health, experience, credits, strength, agility, intellect, endurance, metabolism, targetId]
            });

            message.reply(`Successfully set cat ${targetId} as ${statsString}`);
        } else if (category === 'bal' || category === 'balance') {
            const amount = parseBigNumber(args[2] || '0') ?? 0n;
            await getUser(targetId);
            await updateUser(targetId, { balance: amount });
            message.reply(`✅ Set balance to 💵 ${formatBigNumber(amount)}`);
        } else if (category === 'vault') {
            const amount = parseBigNumber(args[2] || '0') ?? 0n;
            await getUser(targetId);
            await updateUser(targetId, { vault: amount });
            message.reply(`✅ Set vault to 🏦 ${formatBigNumber(amount)}`);
        } else if (category === 'credits') {
            const amount = parseBigNumber(args[2] || '0') ?? 0n;
            await getUser(targetId);
            await updateUser(targetId, { credits: amount });
            message.reply(`✅ Set credits to 🍥 ${formatBigNumber(amount)}`);
        } else {
            message.reply('Unknown category. Use: cat, bal, vault, credits');
        }
    },
};

export default command;
