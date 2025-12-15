import { Message, Client } from 'discord.js';
import { Command } from '../../handlers/commandHandler';

const command: Command = {
    name: 'patreon',
    description: 'Support the bot development',
    execute: async (message: Message, args: string[], client: Client) => {
        message.reply('Work in Progress');
    },
};

export default command;
