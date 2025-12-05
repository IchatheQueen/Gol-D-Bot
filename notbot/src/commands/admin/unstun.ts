
import { Message, Client, EmbedBuilder } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';
import { getUserColor } from '../../database/userColor';

const command: Command = {
    name: 'unstun',
    description: 'Admin command to unstun a user',
    execute: async (message: Message, args: string[], client: Client) => {
        const ADMIN_ID = '1331780893995565148';
        if (message.author.id !== ADMIN_ID) {
            return;
        }

        const targetUser = message.mentions.users.first() || message.author;

        // Remove stun
        await db.execute({
            sql: 'DELETE FROM stuns WHERE user_id = ?',
            args: [targetUser.id]
        });

        const color = getUserColor(message.author.id);
        const embed = new EmbedBuilder()
            .setDescription(`✅ **${targetUser.username}** has been unstunned!`)
            .setColor(color);

        await message.reply({ embeds: [embed] });
    },
};

export default command;
