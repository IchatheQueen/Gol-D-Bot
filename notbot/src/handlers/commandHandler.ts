import { Client, Message } from 'discord.js';
import fs from 'fs';
import path from 'path';

export interface Command {
    name: string;
    description: string;
    aliases?: string[];
    execute: (message: Message, args: string[], client: Client) => Promise<void> | void;
}

export const loadCommands = (client: Client): Map<string, Command> => {
    const commands = new Map<string, Command>();
    const commandsPath = path.join(__dirname, '../commands');

    const readCommands = (dir: string) => {
        const files = fs.readdirSync(dir);

        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);

            if (stat.isDirectory()) {
                readCommands(filePath);
            } else if (file.endsWith('.ts')) {
                const commandModule = require(filePath);
                const command: Command = commandModule.default || commandModule;

                if (command.name) {
                    commands.set(command.name, command);
                    if (command.aliases) {
                        command.aliases.forEach(alias => commands.set(alias, command));
                    }
                    console.log(`Loaded command: ${command.name}`);
                }
            }
        }
    };

    if (fs.existsSync(commandsPath)) {
        readCommands(commandsPath);
    }

    return commands;
};
