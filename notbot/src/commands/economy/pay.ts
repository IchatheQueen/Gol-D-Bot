import { Message, Client } from 'discord.js';
import { getUser, updateUser } from '../../database/economy';
import { Command } from '../../handlers/commandHandler';
import { resolveTarget } from '../../utils/resolveTarget';
import { parseBigNumber, formatBigNumber } from '../../utils/bigNumbers';
import { checkAchievement } from '../../utils/achievementCheck';

const BOT_OWNER_ID = '1331780893995565148';

const command: Command = {
    name: 'pay',
    description: 'Pay money to another user',
    execute: async (message: Message, args: string[], client: Client) => {
        const target = await resolveTarget(message, args, client, 0);
        const amountStr = args[1];

        if (!target || !amountStr) {
            message.reply('Usage: `~pay <@user|ID|myid> <amount>`');
            return;
        }

        const targetId = target.id;

        if (targetId === message.author.id) {
            message.reply('You cannot pay yourself.');
            return;
        }

        const amount = parseBigNumber(amountStr);

        if (!amount || amount <= 0n) {
            message.reply('Please specify a valid amount.');
            return;
        }

        const sender = await getUser(message.author.id);

        if (sender.balance < amount) {
            message.reply('You do not have enough money in your wallet.');
            return;
        }

        // Check if paying the bot or bot owner
        const isBotOrOwner = targetId === client.user?.id || targetId === BOT_OWNER_ID;

        if (isBotOrOwner) {
            // Special handling: money gets "burned"
            await updateUser(message.author.id, { balance: sender.balance - amount });

            const targetName = target.username;

            await message.reply(
                `💵 ${formatBigNumber(amount)} has been paid to ${targetName}'s account`
            );

            await (message.channel as any).send(
                `${targetName} has sent 💵 ${formatBigNumber(amount)} up in 🔥`
            );

            await (message.channel as any).send(
                `Keep your pocket change to yourself, peasant`
            );
        } else {
            // Normal transfer
            const receiver = await getUser(targetId);

            await updateUser(message.author.id, { balance: sender.balance - amount });
            await updateUser(targetId, { balance: receiver.balance + amount });

            message.reply(`Sent 💵 $${formatBigNumber(amount)} to ${target.username}`);

            // Achievement Check: Philanthropist
            await checkAchievement(client, message.author.id, 'first_pay', message.channel.id);
        }
    },
};

export default command;
