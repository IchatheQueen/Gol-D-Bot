import { Message, Client } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';
import { getUserColor } from '../../database/userColor';

// Base feed cooldown. Previously the check below used 30m while the reduction
// math assumed 1h, so petting moved the timer by the wrong amount.
const FEED_COOLDOWN_MS = 30 * 60 * 1000;

// "Reduce your pets feeding cooldown by 1/3" — so the remaining time is scaled
// to 2/3, not cut by a flat amount. (24m remaining -> 16m, as the real bot shows.)
const PET_REDUCTION_NUMERATOR = 2n;
const PET_REDUCTION_DENOMINATOR = 3n;

const command: Command = {
    name: 'pet',
    description: 'Pet your cat to reduce feed cooldown',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;

        // Get pet
        const petCheck = await db.execute({
            sql: 'SELECT * FROM pets WHERE user_id = ?',
            args: [userId]
        });
        const pet = petCheck.rows[0] as any;

        if (!pet) {
            // Plain text, not an embed — matches how rejections render.
            message.reply('You do not have a pet [Lvl 1] Cat; `~adopt` to adopt one!');
            return;
        }

        // Check if feed is on cooldown
        const cooldownCheck = await db.execute({
            sql: 'SELECT * FROM cooldowns WHERE user_id = ? AND command = ?',
            args: [userId, 'feed']
        });
        const feedCooldown = cooldownCheck.rows[0] as any;

        if (!feedCooldown) {
            message.reply('Your cat doesn\'t need petting right now!');
            return;
        }

        const timeLeft = Number(feedCooldown.timestamp) + FEED_COOLDOWN_MS - Date.now();

        if (timeLeft <= 0) {
            message.reply('Feed cooldown already expired!');
            return;
        }

        // Petting takes time off the remaining feed cooldown; the reply reports
        // whatever is actually left, which is why real output varies (e.g. 16m)
        // rather than always naming a fixed number.
        const reducedTimeLeft = Math.max(
            0,
            Number((BigInt(Math.floor(timeLeft)) * PET_REDUCTION_NUMERATOR) / PET_REDUCTION_DENOMINATOR)
        );
        const newTimestamp = Date.now() - FEED_COOLDOWN_MS + reducedTimeLeft;

        await db.execute({
            sql: 'UPDATE cooldowns SET timestamp = ? WHERE user_id = ? AND command = ?',
            args: [newTimestamp, userId, 'feed']
        });

        const minutesLeft = Math.ceil(reducedTimeLeft / (60 * 1000));
        const displayName = message.guild?.members.cache.get(userId)?.displayName || message.author.username;
        const embed = {
            description: `${displayName} (@${message.author.username}) has pet their [Lvl ${pet.level}] Cat and reduced its feeding cooldown to ${minutesLeft} minutes`,
            color: getUserColor(userId)
        };

        message.reply({ embeds: [embed] });
    },
};

export default command;
