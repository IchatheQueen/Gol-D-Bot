import { Message, Client, EmbedBuilder } from 'discord.js';
import { getUser, updateUser } from '../../database/economy';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';
import { getUserColor } from '../../database/userColor';
import { formatBigNumber } from '../../utils/bigNumbers';

const command: Command = {
    name: 'grab',
    description: 'Grab a dropped wallet',
    execute: async (message: Message, args: string[], client: Client) => {
        const channelId = message.channel.id;

        // Check DB for active drop
        const result = await db.execute({
            sql: 'SELECT * FROM wallet_drops WHERE channel_id = ?',
            args: [channelId]
        });

        const drop = result.rows[0];

        if (!drop) {
            const embed = new EmbedBuilder()
                .setDescription('There are currently no wallets dropped in this channel!')
                .setColor(getUserColor(message.author.id));
            message.reply({ embeds: [embed] });
            return;
        }

        // Atomic delete and reward (prevents race conditions better)
        // Or check if already claimed (though we just delete it upon claim)

        // Delete the drop
        await db.execute({
            sql: 'DELETE FROM wallet_drops WHERE channel_id = ?',
            args: [channelId]
        });

        // Add money to user
        const amount = BigInt(drop.amount as string);
        const user = await getUser(message.author.id);
        await updateUser(message.author.id, { balance: user.balance + amount });

        // Send success message
        const embed = new EmbedBuilder()
            .setDescription(`@${message.author.username} snatches a wallet and found:\n• 💵 ${formatBigNumber(amount)}`)
            .setColor(getUserColor(message.author.id));
        await message.reply({ embeds: [embed] });
    },
},
};

export default command;
