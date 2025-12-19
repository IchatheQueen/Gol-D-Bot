import { Message, Client, EmbedBuilder } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';
import { addInventoryItem } from '../../database/inventory';

const command: Command = {
    name: 'dispense',
    description: 'Collect pills from your Pill Generator',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;

        const genRes = await db.execute({ sql: 'SELECT * FROM generators WHERE user_id = ?', args: [userId] });
        if (genRes.rows.length === 0) {
            message.reply('You do not have a Pill Generator! Use `~gen` to get started.');
            return;
        }

        const gen = genRes.rows[0] as any;
        const now = Date.now();
        const cooldown = 60 * 60 * 1000;

        if (now - (gen.last_claim || 0) < cooldown) {
            const remaining = Math.ceil((cooldown - (now - gen.last_claim)) / 60000);
            message.reply(`Generator is warming up. Available in ${remaining} minutes.`);
            return;
        }

        const min = gen.efficiency_level || 1;
        const max = min * 2;
        const count = Math.floor(Math.random() * (max - min + 1)) + min;

        // Update Claim Time
        await db.execute({ sql: 'UPDATE generators SET last_claim = ? WHERE user_id = ?', args: [now, userId] });

        // Add Pills to Inventory
        await addInventoryItem(userId, 'cat_pill', BigInt(count));

        const displayName = message.guild?.members.cache.get(userId)?.displayName || message.author.username;
        const embed = new EmbedBuilder()
            .setDescription(`${displayName} (@${message.author.username}) has collected 💊 ${count} from their 🏭`)
            .setColor('#2b2d31');

        message.reply({ embeds: [embed] });
    },
};

export default command;
