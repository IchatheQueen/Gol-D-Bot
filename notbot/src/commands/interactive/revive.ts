import { Message, Client } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';
import { updatePetStats, isPetDead } from '../../utils/petUtils';
import { getInventoryItem, removeInventoryItem } from '../../database/inventory';

const command: Command = {
    name: 'revive',
    description: 'Revive your dead pet with Medicine',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;

        const pet = await updatePetStats(userId);

        if (!pet) {
            message.reply('You don\'t have a pet to revive!');
            return;
        }

        if (!isPetDead(pet)) {
            message.reply('Your pet is not dead! You don\'t need to revive it.');
            return;
        }

        const medicineAmount = await getInventoryItem(userId, 'medicine');

        if (medicineAmount <= 0n) {
            message.reply('You need a **Medicine** 🩹 to revive your pet! Buy one from the shop (`~gbuy medicine`).');
            return;
        }

        // Revive Logic (Same as feed logic)
        // Reset Health to 100, Energy/Hunger/Thirst to 50
        await db.execute({
            sql: 'UPDATE pets SET health = 100, energy = 50, hunger = 50, thirst = 50 WHERE user_id = ?',
            args: [userId]
        });

        await removeInventoryItem(userId, 'medicine', 1n);

        message.reply('You revived your cat with **Medicine**! 🩹\nIt feels much better.');
    }
};

export default command;
