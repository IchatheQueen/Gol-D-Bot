import { Message, Client } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';
import { updatePetStats, isPetDead } from '../../utils/petUtils';
import { addInventoryItem } from '../../database/inventory';

const command: Command = {
    name: 'butcher',
    description: 'Butcher your pet for meat',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;

        const pet = await updatePetStats(userId);

        if (!pet) {
            message.reply('You don\'t have a pet to butcher!');
            return;
        }

        // Logic: Delete pet, give items (Meat? Bone?)
        // items.ts check: 'meat'?
        // If not exists, maybe just give 'cat_food'? "You butchered your cat and made cat food."

        await db.execute({
            sql: 'DELETE FROM pets WHERE user_id = ?',
            args: [userId]
        });

        const meatAmount = Math.floor(Math.random() * 3) + 1;
        await addInventoryItem(userId, 'cat_food', BigInt(meatAmount));

        message.reply(`You butchered your **${pet.name}**... You monster! 🪓\nReceived ${meatAmount} Cat Food.`);
    },
};

export default command;
