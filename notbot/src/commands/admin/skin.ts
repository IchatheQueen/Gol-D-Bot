import { Message, Client } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';
import { EmbedUtils } from '../../utils/embeds';

const ADMIN_ID = '1331780893995565148';

const command: Command = {
    name: 'skin',
    description: 'Manage custom command skins/aliases (Admin only)',
    execute: async (message: Message, args: string[], client: Client) => {
        if (message.author.id !== ADMIN_ID) {
            return;
        }

        const subCommand = args[0]?.toLowerCase();

        if (!subCommand) {
            message.reply({ embeds: [EmbedUtils.info('Usage: ~skin <add|remove|list> ...')] });
            return;
        }

        if (subCommand === 'add') {
            const alias = args[1]?.toLowerCase();
            const target = args[2]?.toLowerCase();
            const aliasArgs = args.slice(3).join(' ');

            if (!alias || !target) {
                message.reply({ embeds: [EmbedUtils.error('Usage: ~skin add <alias> <target_command> [args]')] });
                return;
            }

            try {
                await db.execute({
                    sql: 'INSERT OR REPLACE INTO command_aliases (alias_name, target_command, arguments) VALUES (?, ?, ?)',
                    args: [alias, target, aliasArgs]
                });
                message.reply({ embeds: [EmbedUtils.success(`Skin created: \`~${alias}\` -> \`~${target} ${aliasArgs}\``)] });
            } catch (error) {
                console.error(error);
                message.reply({ embeds: [EmbedUtils.error('Failed to create skin.')] });
            }
        }
        else if (subCommand === 'remove') {
            const alias = args[1]?.toLowerCase();
            if (!alias) {
                message.reply({ embeds: [EmbedUtils.error('Usage: ~skin remove <alias>')] });
                return;
            }

            try {
                await db.execute({
                    sql: 'DELETE FROM command_aliases WHERE alias_name = ?',
                    args: [alias]
                });
                message.reply({ embeds: [EmbedUtils.success(`Skin removed: \`~${alias}\``)] });
            } catch (error) {
                console.error(error);
                message.reply({ embeds: [EmbedUtils.error('Failed to remove skin.')] });
            }
        }
        else if (subCommand === 'list') {
            try {
                const result = await db.execute('SELECT * FROM command_aliases');
                if (result.rows.length === 0) {
                    message.reply({ embeds: [EmbedUtils.info('No skins found.')] });
                    return;
                }

                const list = result.rows.map((row: any) => `**~${row.alias_name}** -> \`~${row.target_command} ${row.arguments}\``).join('\n');
                message.reply({ embeds: [EmbedUtils.basic(list, 'Custom Skins')] });
            } catch (error) {
                console.error(error);
                message.reply({ embeds: [EmbedUtils.error('Failed to list skins.')] });
            }
        }
    },
};

export default command;
