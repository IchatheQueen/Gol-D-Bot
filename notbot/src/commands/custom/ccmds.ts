import { Message, Client, EmbedBuilder } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';
import { resolveTargetOrSelf } from '../../utils/resolveTarget';
import { getUserColor } from '../../database/userColor';

const command: Command = {
    name: 'ccmds',
    description: 'View custom commands managed by a user',
    execute: async (message: Message, args: string[], client: Client) => {
        const target = await resolveTargetOrSelf(message, args, client);

        const managed = await db.execute({
            sql: 'SELECT command_name FROM custom_command_access WHERE user_id = ? AND access_type = ?',
            args: [target.id, 'co_owner']
        });

        const list = managed.rows.map(row => `• ${row.command_name}`).join('\n');

        const embed = new EmbedBuilder()
            .setTitle(`${target.username} (@${target.username}) managed customs`)
            .setDescription(`⚠️ Cosmetics may **NOT** be sold by non owners as per our [Terms of Service](https://discord.com). Ask this user to run \`~ccmdown\` for their ownership list.\n\n${list || 'None'}`)
            .setColor(getUserColor(target.id)); // Using user's color if possible

        // Note: verify color logic. If it fails, default to something? 
        // getUserColor handles it.

        // Wait, the screenshot shows a pink bar. 
        // I'll stick to dynamic color.

        message.reply({ embeds: [embed] });
    }
};

export default command;
