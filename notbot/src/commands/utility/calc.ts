import { Message, Client } from 'discord.js';
import { Command } from '../../handlers/commandHandler';

const command: Command = {
    name: 'calc',
    description: 'Calculate a math expression',
    execute: async (message: Message, args: string[], client: Client) => {
        if (args.length === 0) {
            message.reply('Please provide a math expression.');
            return;
        }

        const expression = args.join(' ');

        // Basic Security Check: Allow only numbers, operators, parentheses, and spaces
        if (!/^[0-9+\-*/().\s]+$/.test(expression)) {
            message.reply('Invalid characters in expression. Only numbers and basic operators (+, -, *, /, (, )) are allowed.');
            return;
        }

        try {
            // Safer evaluation
            const result = new Function(`return ${expression}`)();

            if (!isFinite(result) || isNaN(result)) {
                message.reply('Result is invalid (NaN or Infinity).');
                return;
            }

            message.reply(String(result));
        } catch (error) {
            message.reply('Error calculating expression.');
        }
    }
};

export default command;
