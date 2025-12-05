import { Message, Client, EmbedBuilder } from 'discord.js';
import { getUser } from '../../database/economy';
import { Command } from '../../handlers/commandHandler';
import { getUserColor } from '../../database/userColor';

const command: Command = {
    name: 'dcred',
    description: 'Check your available credit or get help',
    execute: async (message: Message, args: string[], client: Client) => {
        if (args[0] === 'help') {
            const embed = new EmbedBuilder()
                .setTitle('💎 | Credit Help')
                .setDescription('💎 **Credits** is the Premium currency that can be spent on cosmetic skins, upgrades and more')
                .addFields({
                    name: 'Related Commands',
                    value: '`~donate` to purchase 💎 Credit\n`~market` to spend your 💎 Credit\n`~dpay <user> <amount>` to transfer 💎 Credit to another account'
                })
                .setColor(getUserColor(message.author.id));

            message.reply({ embeds: [embed] });
            return;
        }

        const user = await getUser(message.author.id);
        const credits = user.credits || 0;

        const embed = new EmbedBuilder()
            .setAuthor({ name: `${message.author.username}'s 💎 Credits`, iconURL: message.author.displayAvatarURL() })
            .setDescription('PREMIUM CURRENCY\n`~dcred help` to get more information\n\n**Available Credit**\n💎 ' + credits.toLocaleString(undefined, { minimumFractionDigits: 2 }))
            .setColor(getUserColor(message.author.id));

        message.reply({ embeds: [embed] });
    },
};

export default command;
