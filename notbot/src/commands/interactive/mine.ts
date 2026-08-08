import { Message, Client, EmbedBuilder } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';
import { getInventoryItem, addInventoryItem } from '../../database/inventory';
import { getUserColor } from '../../database/userColor';
import { userTag } from '../../utils/userTag';
import { VAULT_TOKEN_ITEM } from '../../database/vault';
import { rollEventCurrency } from '../../database/events';

const PICKAXE_ITEM = '203';
const MINE_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour

// Gems are fractional and stored as hundredths, so a haul of 5-45 hundredths
// reads as 💎 0.05 - 0.45. A Miner's Capsule costs 💎 0.20.
const GEM_MIN_HUNDREDTHS = 5;
const GEM_MAX_HUNDREDTHS = 45;

// "Vault Tokens can be earned through hunting, mining, grabbing wallets"
const VAULT_TOKEN_CHANCE = 0.15;

const command: Command = {
    name: 'mine',
    description: 'Mine the depths for 💎 Gems',
    usage: '~mine',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;

        const pet = await db.execute({
            sql: 'SELECT level FROM pets WHERE user_id = ?',
            args: [userId]
        });
        const petRow = pet.rows[0] as any;

        if (!petRow) {
            message.reply('You do not have a pet [Lvl 1] Cat; `~adopt` to adopt one!');
            return;
        }

        const pickaxe = await getInventoryItem(userId, PICKAXE_ITEM);

        if (pickaxe < 1n) {
            message.reply(
                `Sorry ${userTag(message)}, your [Lvl ${petRow.level}] Cat does not have a ⛏️ Pickaxe. ` +
                'Purchase access to this tool via the `~cshop`'
            );
            return;
        }

        const cooldownCheck = await db.execute({
            sql: 'SELECT timestamp FROM cooldowns WHERE user_id = ? AND command = ?',
            args: [userId, 'mine']
        });
        const cooldownRow = cooldownCheck.rows[0] as any;

        if (cooldownRow) {
            const timeLeft = Number(cooldownRow.timestamp) + MINE_COOLDOWN_MS - Date.now();
            if (timeLeft > 0) {
                const minutes = Math.ceil(timeLeft / (60 * 1000));
                message.reply(`Your cat is still recovering from the mines! Wait **${minutes}m**.`);
                return;
            }
        }

        const gemHundredths = BigInt(
            Math.floor(Math.random() * (GEM_MAX_HUNDREDTHS - GEM_MIN_HUNDREDTHS + 1)) + GEM_MIN_HUNDREDTHS
        );
        await addInventoryItem(userId, 'gem', gemHundredths);

        const lines = [`• 💎 ${(Number(gemHundredths) / 100).toFixed(2)}`];

        if (Math.random() < VAULT_TOKEN_CHANCE) {
            await addInventoryItem(userId, VAULT_TOKEN_ITEM, 1n);
            lines.push('• 🎫 1 Vault Token');
        }

        // No-ops outside of a seasonal event window.
        const found = await rollEventCurrency(userId);
        if (found) {
            lines.push(`• ${found.event.currencyEmoji} ${found.amount} ${found.event.currencyName}`);
        }

        await db.execute({
            sql: 'INSERT OR REPLACE INTO cooldowns (user_id, command, timestamp) VALUES (?, ?, ?)',
            args: [userId, 'mine', Date.now()]
        });

        const embed = new EmbedBuilder()
            .setDescription(
                `${userTag(message)}'s [Lvl ${petRow.level}] Cat plunged into the depths and surfaced with:\n` +
                lines.join('\n')
            )
            .setColor(getUserColor(userId));

        message.reply({ embeds: [embed] });
    },
};

export default command;
