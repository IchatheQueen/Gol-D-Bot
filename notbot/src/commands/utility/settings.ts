import { Message, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';
import { getUserColor } from '../../database/userColor';
import { cachePrefix } from '../../database/userSettings';

interface SettingDef {
    key: string;
    col: string;
    emoji: string;
    label: string;
    /** Description lines, rendered one per `└` row. */
    lines: (current: any) => string[];
    /** Prefix takes a value rather than toggling. */
    valued?: boolean;
}

const SETTINGS: SettingDef[] = [
    {
        key: 'dnd', col: 'dnd', emoji: '🔔', label: 'Do Not Disturb',
        lines: () => ['Having this setting enabled removes most DM notifications'],
    },
    {
        key: 'shiny', col: 'shiny_cat', emoji: '✨', label: 'Shiny Cat Name',
        lines: () => ['Requires 🟡 GoldBot Gold', "Makes your pet's display name Shiny"],
    },
    {
        key: 'gifting', col: 'premium_gifting', emoji: '🎁', label: 'Premium Gifting',
        lines: () => [
            '⚠️ Allowing gifts can lead to fraud detections flagging your account!',
            'Allows you to receive gifts from others',
        ],
    },
    {
        key: 'recruit', col: 'recruit_requests', emoji: '📮', label: 'Recruit Requests',
        lines: () => [
            "⚠️ If you accept requests you won't be able to use GoldBot!",
            'Having this enabled allows you to receive recruit requests.',
        ],
    },
    {
        key: 'lb', col: 'lb_anon', emoji: '📈', label: 'LB Anon',
        lines: () => ['Displays you on leaderboards as `[User Hidden]`'],
    },
    {
        key: 'prefix', col: 'personal_prefix', emoji: '☑️', label: 'Personal Prefix',
        valued: true,
        lines: (current) => [
            'Your own prefix. Remove with `~settings prefix reset`',
            `Current personal prefix: ${current || '~'}`,
        ],
    },
    {
        key: 'lsdvault', col: 'lsd_vault', emoji: '🔄', label: 'LSD Vault Withdraw',
        lines: () => ['Dispensing on lsd withdraws price from vault instead of generator funds'],
    },
];

const PER_PAGE = 6;
const PAGE_COUNT = Math.ceil(SETTINGS.length / PER_PAGE);

function buildEmbed(username: string, userId: string, settings: any, page: number) {
    const slice = SETTINGS.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);

    const body = slice.map(def => {
        const current = settings[def.col];
        const state = def.valued
            ? (current ? '🟢' : '🔴')
            : (Number(current) === 1 ? '🟢' : '🔴');
        const head = `${def.emoji} **${def.label}** [ \`${def.key}\` ] (${state})`;
        return [head, ...def.lines(current).map(l => `└ ${l}`)].join('\n');
    }).join('\n');

    return new EmbedBuilder()
        .setTitle(`@${username}'s GoldBot Settings`)
        .setDescription('Toggle your settings via `~settings <setting>`\n\n' + body)
        .setColor(getUserColor(userId));
}

function buildButtons(page: number) {
    const mk = (id: string, label: string, disabled: boolean) =>
        new ButtonBuilder().setCustomId(id).setLabel(label).setStyle(ButtonStyle.Secondary).setDisabled(disabled);

    return new ActionRowBuilder<ButtonBuilder>().addComponents(
        mk('first', '<<', page === 0),
        mk('prev', '<', page === 0),
        mk('next', '>', page >= PAGE_COUNT - 1),
        mk('last', '>>', page >= PAGE_COUNT - 1),
    );
}

const command: Command = {
    name: 'settings',
    description: 'Manage your user settings',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;
        const key = args[0]?.toLowerCase();

        let settingsRes = await db.execute({ sql: 'SELECT * FROM user_settings WHERE user_id = ?', args: [userId] });
        if (settingsRes.rows.length === 0) {
            await db.execute({ sql: 'INSERT INTO user_settings (user_id) VALUES (?)', args: [userId] });
            settingsRes = await db.execute({ sql: 'SELECT * FROM user_settings WHERE user_id = ?', args: [userId] });
        }
        const settings = settingsRes.rows[0] as any;

        const def = SETTINGS.find(s => s.key === key);

        if (def?.valued) {
            const value = args[1];

            if (!value) {
                message.reply(`Usage: \`~settings prefix <prefix>\` or \`~settings prefix reset\``);
                return;
            }

            if (value.toLowerCase() === 'reset') {
                await db.execute({
                    sql: `UPDATE user_settings SET ${def.col} = NULL WHERE user_id = ?`,
                    args: [userId]
                });
                cachePrefix(userId, null);
                message.reply('Your personal prefix has been reset.');
                return;
            }

            if (value.length > 5) {
                message.reply('A personal prefix can be at most 5 characters.');
                return;
            }

            await db.execute({
                sql: `UPDATE user_settings SET ${def.col} = ? WHERE user_id = ?`,
                args: [value, userId]
            });
            cachePrefix(userId, value);
            message.reply(`Your personal prefix is now \`${value}\`.`);
            return;
        }

        if (def) {
            const newVal = Number(settings[def.col]) === 0 ? 1 : 0;
            await db.execute({
                sql: `UPDATE user_settings SET ${def.col} = ? WHERE user_id = ?`,
                args: [newVal, userId]
            });
            message.reply(`Toggled **${def.label}** to **${newVal === 1 ? 'ON' : 'OFF'}**.`);
            return;
        }

        if (key) {
            message.reply(`Unknown setting. Available: ${SETTINGS.map(s => `\`${s.key}\``).join(', ')}`);
            return;
        }

        let page = 0;
        const reply = await message.reply({
            embeds: [buildEmbed(message.author.username, userId, settings, page)],
            components: [buildButtons(page)],
        });

        const collector = reply.createMessageComponentCollector({ time: 120000 });

        collector.on('collect', async (i) => {
            if (i.user.id !== userId) {
                await i.reply({ content: 'These settings are not yours!', ephemeral: true });
                return;
            }

            if (i.customId === 'first') page = 0;
            else if (i.customId === 'prev') page = Math.max(0, page - 1);
            else if (i.customId === 'next') page = Math.min(PAGE_COUNT - 1, page + 1);
            else if (i.customId === 'last') page = PAGE_COUNT - 1;

            await i.update({
                embeds: [buildEmbed(message.author.username, userId, settings, page)],
                components: [buildButtons(page)],
            });
        });

        collector.on('end', async () => {
            try {
                await reply.edit({ components: [] });
            } catch {
                // Message deleted.
            }
        });
    },
};

export default command;
