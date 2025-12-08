import { Message, Client } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';
import { EmbedUtils } from '../../utils/embeds';

const ADMIN_ID = '1331780893995565148';

const command: Command = {
    name: 'tag',
    description: 'Manage command tags/skins (Admin only)',
    execute: async (message: Message, args: string[], client: Client) => {
        if (message.author.id !== ADMIN_ID) {
            return;
        }

        const subCommand = args[0]?.toLowerCase();

        if (!subCommand) {
            message.reply({ embeds: [EmbedUtils.info('Usage: ~tag set <user> <command> <skin>')] });
            return;
        }

        if (subCommand === 'set') {
            const targetId = message.mentions.users.first()?.id || args[1];
            const cmd = args[2]?.toLowerCase();
            const skin = args[3]?.toLowerCase();

            if (!targetId || !cmd || !skin) {
                message.reply({ embeds: [EmbedUtils.error('Usage: ~tag set <user> <command> <skin>')] });
                return;
            }

            try {
                await db.execute({
                    sql: 'INSERT OR REPLACE INTO user_command_skins (user_id, command, skin_name) VALUES (?, ?, ?)',
                    args: [targetId, cmd, skin]
                });
                message.reply({ embeds: [EmbedUtils.success(`Set **${cmd}** skin for <@${targetId}> to **${skin}**`)] });
            } catch (error) {
                console.error(error);
                message.reply({ embeds: [EmbedUtils.error('Failed to set tag.')] });
            }
        }
        else if (subCommand === 'remove') {
            const targetId = message.mentions.users.first()?.id || args[1];
            const cmd = args[2]?.toLowerCase();

            if (!targetId || !cmd) {
                message.reply({ embeds: [EmbedUtils.error('Usage: ~tag remove <user> <command>')] });
                return;
            }

            try {
                await db.execute({
                    sql: 'DELETE FROM user_command_skins WHERE user_id = ? AND command = ?',
                    args: [targetId, cmd]
                });
                message.reply({ embeds: [EmbedUtils.success(`Removed **${cmd}** skin for <@${targetId}>`)] });
            } catch (error) {
                console.error(error);
                message.reply({ embeds: [EmbedUtils.error('Failed to remove tag.')] });
            }
        }
    },
};

export default command;
