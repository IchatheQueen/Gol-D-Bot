import { Message, Client, EmbedBuilder } from 'discord.js';
import { getUser, updateUser } from '../../database/economy';
import { Command } from '../../handlers/commandHandler';
import { getUserColor } from '../../database/userColor';
import { formatBigNumber } from '../../utils/bigNumbers';

const command: Command = {
    name: 'grab',
    description: 'Grab a dropped wallet',
    execute: async (message: Message, args: string[], client: Client) => {
        const channelId = message.channel.id;

        // Check if there's an active wallet drop in this channel
        const drop = (client as any).activeWalletDrops?.get(channelId);

        if (!drop) {
            const embed = new EmbedBuilder()
                .setDescription('There are currently no wallets dropped in this channel!')
                .setColor(getUserColor(message.author.id));
            message.reply({ embeds: [embed] });
            return;
        }

        if (drop.claimedBy) {
            return; // Already claimed
        }

        // Mark as claimed
        drop.claimedBy = message.author.id;

        // Add money to user (convert drop amount to BigInt)
        const amount = BigInt(drop.amount);
        const user = await getUser(message.author.id);
        await updateUser(message.author.id, { balance: user.balance + amount });

        // Send success message
        const embed = new EmbedBuilder()
            .setDescription(`@${message.author.username} snatches a wallet and found:\n• 💵 ${formatBigNumber(amount)}`)
            .setColor(getUserColor(message.author.id));
        await message.reply({ embeds: [embed] });

        // Remove the drop
        (client as any).activeWalletDrops?.delete(channelId);
    },
};

export default command;
