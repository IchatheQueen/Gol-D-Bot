
import { Message, Client, EmbedBuilder } from 'discord.js';
import { Command } from '../../handlers/commandHandler';
import { getUserColor } from '../../database/userColor';

const command: Command = {
    name: 'support',
    description: 'Join the GoldBot support server',
    execute: async (message: Message, args: string[], client: Client) => {
        const embed = new EmbedBuilder()
            .setTitle('🌟 Join GoldBot Server')
            .setDescription('Join our official server for updates, support, and community!')
            .addFields({
                name: 'Server Link',
                value: '[Click here to join!](https://discord.gg/vCnqckmmW6)'
            })
            .setColor(getUserColor(message.author.id));

        message.reply({ embeds: [embed] });
    },
};

export default command;
