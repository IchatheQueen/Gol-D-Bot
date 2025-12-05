import { Message, Client, EmbedBuilder } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';
import { items } from '../../data/items';
import { getUserColor } from '../../database/userColor';

const command: Command = {
    name: 'ditems',
    description: 'Check the premium items you possess',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;

        // Fetch inventory items that are type 'collectible' and have currency 'diamond'
        const premiumIds = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10', 'p11', 'p12', 'p13'];

        const placeholders = premiumIds.map(() => '?').join(',');
        const result = await db.execute({
            sql: `SELECT * FROM inventory WHERE user_id = ? AND item_id IN (${placeholders}) AND amount > 0`,
            args: [userId, ...premiumIds]
        });
        const inventory = result.rows as any[];

        const embed = new EmbedBuilder()
            .setAuthor({ name: `🌱 {${message.author.username}}'s Donor Items`, iconURL: message.author.displayAvatarURL() })
            .setDescription('`~dshop` to purchase items\n`~dtransfer <user> <name>` to transfer an item to another account (thus losing it on your current account)\n\n**Donator Items:**')
            .setColor(getUserColor(message.author.id));

        if (inventory.length === 0) {
            embed.addFields({ name: '\u200B', value: 'This user does not own any donator items.' });
        } else {
            let description = '';
            inventory.forEach(item => {
                const itemDef = items[item.item_id];
                if (itemDef) {
                    description += `**${itemDef.name}** (x${item.amount})\n`;
                }
            });
            embed.addFields({ name: '\u200B', value: description });
        }

        message.reply({ embeds: [embed] });
    },
};

export default command;
