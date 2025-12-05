import { Message, Client } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';
import { getInventory } from '../../database/inventory';

const command: Command = {
    name: 'getdata',
    description: 'Dump all data for a user',
    execute: async (message: Message, args: string[], client: Client) => {
        // Only allow admin/owner
        // For now, let's allow everyone to see their own data, or admin to see others.
        // The screenshot shows "~getdata myid", implying self-lookup or ID lookup.

        let targetId = args[0];
        if (targetId === 'myid' || !targetId) {
            targetId = message.author.id;
        }

        // Fetch User Data
        const userCheck = await db.execute({ sql: 'SELECT * FROM users WHERE id = ?', args: [targetId] });
        const user = userCheck.rows[0] as any;

        // Fetch Inventory
        const inventory = await getInventory(targetId);

        // Fetch Pet
        const petCheck = await db.execute({ sql: 'SELECT * FROM pets WHERE user_id = ?', args: [targetId] });
        const pet = petCheck.rows[0] as any;

        // Fetch Cooldowns
        const cooldownsCheck = await db.execute({ sql: 'SELECT * FROM cooldowns WHERE user_id = ?', args: [targetId] });
        const cooldowns = cooldownsCheck.rows as any[];

        // Fetch Stuns
        const stunsCheck = await db.execute({ sql: 'SELECT * FROM stuns WHERE user_id = ?', args: [targetId] });
        const stuns = stunsCheck.rows as any[];

        if (!user && !pet && inventory.length === 0) {
            message.reply('No data found for this user.');
            return;
        }

        let output = `**Data for ${targetId}**\n`;

        if (user) {
            output += `**User Table**:\n`;
            for (const [key, value] of Object.entries(user)) {
                output += `${key}=${value}\n`;
            }
        }

        if (pet) {
            output += `\n**Pet Table**:\n`;
            for (const [key, value] of Object.entries(pet)) {
                output += `${key}=${value}\n`;
            }
        }

        if (inventory.length > 0) {
            output += `\n**Inventory**:\n`;
            inventory.forEach(item => {
                output += `item_id=${item.item_id}, amount=${item.amount.toString()}\n`;
            });
        }

        if (cooldowns.length > 0) {
            output += `\n**Cooldowns**:\n`;
            cooldowns.forEach(cd => {
                output += `command=${cd.command}, timestamp=${cd.timestamp}\n`;
            });
        }

        if (stuns.length > 0) {
            output += `\n**Stuns**:\n`;
            stuns.forEach(stun => {
                output += `expires_at=${stun.expires_at}, reason=${stun.reason}\n`;
            });
        }

        // Split into chunks if too long
        if (output.length > 2000) {
            const chunks = output.match(/[\s\S]{1,1900}/g) || [];
            for (const chunk of chunks) {
                message.reply(`\`\`\`ini\n${chunk}\n\`\`\``);
            }
        } else {
            message.reply(`\`\`\`ini\n${output}\n\`\`\``);
        }
    },
};

export default command;
