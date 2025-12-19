import { Message, Client, EmbedBuilder } from 'discord.js';
import db from '../../database/db';
import { getUser } from '../../database/economy';
import { resolveTargetOrSelf } from '../../utils/resolveTarget';
import { Command } from '../../handlers/commandHandler';
import { getUserColor } from '../../database/userColor';
import { formatBigNumber } from '../../utils/bigNumbers';

const command: Command = {
    name: 'balance',
    description: 'Check your balance',
    aliases: ['bal', 'money'],
    execute: async (message: Message, args: string[], client: Client) => {
        const target = await resolveTargetOrSelf(message, args, client);
        const userId = target.id;
        const user = await getUser(userId);

        // Check for specific skin/tag
        let skinName = null;
        try {
            const skinResult = await db.execute({
                sql: 'SELECT skin_name FROM user_command_skins WHERE user_id = ? AND command = ?',
                args: [userId, 'balance']
            });
            if (skinResult.rows.length > 0) {
                skinName = (skinResult.rows[0] as any).skin_name;
            }
        } catch (e) { console.error(e); }

        const embed = new EmbedBuilder()
            .setColor(getUserColor(userId));

        if (skinName === 'waifubal') {
            embed.setDescription(`${target.username} has escaped paying **$${formatBigNumber(user.balance)}** in taxes to the IRS`)
                .setImage('https://media.tenor.com/images/e9d7240c11571477759530419358249a/tenor.gif') // Anime Money GIF
                .setThumbnail('https://media.tenor.com/r_bft3Qp0ioAAAAi/anime-blush.gif');
        } else {
            const displayName = message.guild?.members.cache.get(userId)?.displayName || target.username;
            embed.setTitle(`${displayName} (@${target.username})'s balance`)
                .setDescription(
                    `<:cat_logo:1449971693085786162> Earn extra rewards by playing in SlotHub ~slothub (Click Me)\n` +
                    `💵 ${formatBigNumber(user.balance)}`
                );
        }

        message.reply({ embeds: [embed] });
    },
};

export default command;
