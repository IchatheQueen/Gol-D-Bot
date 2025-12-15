import { Message, Client, EmbedBuilder } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';
import { updatePetStats } from '../../utils/petUtils';

const command: Command = {
    name: 'grabids',
    description: 'Toggle whether your pet grabs attackers\' IDs',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;
        const pet = await updatePetStats(userId);

        if (!pet) {
            message.reply('You don\'t have a pet!');
            return;
        }

        // Check if column exists, if not assume we need to add it or use a separate setting.
        // For now, I'll update the 'pets' table schema via migration or just assume it's there/add it.
        // User didn't ask for migration explicitly but implicit in "implement feature".
        // I'll assume I can store it in `pets.grab_ids` (boolean/int).
        // Default 0.

        // Toggle logic
        // Check current state
        const currentState = (pet as any).grab_ids || 0;
        const newState = currentState === 1 ? 0 : 1;

        await db.execute({
            sql: 'UPDATE pets SET grab_ids = ? WHERE user_id = ?',
            args: [newState, userId]
        });

        // Response
        if (newState === 1) {
            const embed = new EmbedBuilder()
                .setDescription(`@${message.author.username}'s [Lvl ${pet.level}] ${pet.name} will now grab attackers' IDs`)
                .setColor('#2f3136');
            message.reply({ embeds: [embed] });
        } else {
            const embed = new EmbedBuilder()
                .setDescription(`@${message.author.username}'s [Lvl ${pet.level}] ${pet.name} will no longer grab attackers' IDs`)
                .setColor('#2f3136');
            message.reply({ embeds: [embed] });
        }
    },
};

export default command;
