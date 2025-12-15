import { Message, Client } from 'discord.js';
import { Command } from '../../handlers/commandHandler';

const command: Command = {
    name: 'orphank',
    description: 'Kick an orphan (Fun command)',
    execute: async (message: Message, args: string[], client: Client) => {
        // Screenshot shows no output for "~execute 1 orphank" but maybe it was a silent fail or I missed it.
        // "orphank" -> Orphan Kick?
        // Just a flavor command.

        const luck = Math.random();
        if (luck > 0.5) {
            message.reply('You kicked an orphan! 🦶👶 They cried.');
        } else {
            message.reply('You tried to kick an orphan but missed! 😂');
        }
    },
};

export default command;
