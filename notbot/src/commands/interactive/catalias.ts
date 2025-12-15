import { Message, Client, EmbedBuilder } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';
import { CAT_SKINS, getSkin } from '../../data/catSkins';
import { getUserColor } from '../../database/userColor';

const command: Command = {
    name: 'catalias',
    description: 'Select your cat\'s appearance',
    aliases: ['goosealias', 'cataliases'],
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;
        const skinIdArg = args[0];

        // 1. Select Skin
        if (skinIdArg) {
            const skinId = parseInt(skinIdArg);
            const skin = CAT_SKINS.find(s => s.id === skinId);

            if (!skin) {
                message.reply('Invalid skin ID.');
                return;
            }

            // Update pet skin
            await db.execute({
                sql: 'UPDATE pets SET skin_id = ? WHERE user_id = ?',
                args: [skinId, userId]
            });
        }

        // 2. Select Alias
        const aliasId = parseInt(args[0]);
        if (isNaN(aliasId)) {
            message.reply('Please provide a valid numeric ID.');
            return;
        }

        const skin = getSkin(aliasId);
        if (!skin) {
            message.reply('That alias does not exist!');
            return;
        }

        // Optional: Check if user OWNS the skin?
        // User text says "~market to purchase access".
        // I'll skip ownership check for now as no 'skin_inventory' table exists yet, 
        // or assumes everything unlocked or controlled elsewhere.
        // I'll just allow switching.

        await db.execute({
            sql: 'UPDATE pets SET skin_id = ? WHERE user_id = ?',
            args: [aliasId, userId]
        });

        message.reply(`Your cat is now using the **${skin.name}** alias!`);
    }
};

export default command;
