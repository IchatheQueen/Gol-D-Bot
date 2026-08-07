import { Client, Message, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import fs from 'fs';
import path from 'path';

export interface Command {
    name: string;
    description: string;
    aliases?: string[];
    /** Shown by `~help <command>`. Defaults to `~<name>` when omitted. */
    usage?: string;
    execute: (message: Message, args: string[], client: Client, ...extras: any[]) => Promise<void> | void;
}

export const loadCommands = (client: Client): Map<string, Command> => {
    const commands = new Map<string, Command>();
    const commandsPath = path.join(__dirname, '../commands');

    // Tracks which file claimed each name so collisions can be reported.
    // Without this, a duplicate name silently overwrites the earlier command
    // and whichever file readdirSync happens to reach last wins.
    const claimedBy = new Map<string, string>();
    const collisions: string[] = [];
    const unloadable: string[] = [];

    const register = (key: string, command: Command, filePath: string, kind: 'command' | 'alias') => {
        const previous = claimedBy.get(key);
        if (previous) {
            collisions.push(`  '${key}' (${kind}) in ${path.relative(commandsPath, filePath)} overwrites ${path.relative(commandsPath, previous)}`);
        }
        claimedBy.set(key, filePath);
        commands.set(key, command);
    };

    const readCommands = (dir: string) => {
        const files = fs.readdirSync(dir);

        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);

            if (stat.isDirectory()) {
                readCommands(filePath);
            } else if (file.endsWith('.ts') || file.endsWith('.js')) {
                const commandModule = require(filePath);
                const command: Command = commandModule.default || commandModule;

                if (command.name) {
                    register(command.name, command, filePath, 'command');
                    if (command.aliases) {
                        command.aliases.forEach(alias => register(alias, command, filePath, 'alias'));
                    }
                    console.log(`Loaded command: ${command.name}`);
                } else {
                    // Usually a missing `export default command` — the file looks
                    // complete but require() hands back an empty module, so the
                    // command silently does not exist.
                    unloadable.push(path.relative(commandsPath, filePath));
                }
            }
        }
    };

    if (fs.existsSync(commandsPath)) {
        readCommands(commandsPath);
    }

    if (unloadable.length > 0) {
        console.warn(`\n⚠️  ${unloadable.length} file(s) in commands/ registered nothing (missing 'export default'?):`);
        unloadable.forEach(f => console.warn(`  ${f}`));
        console.warn('');
    }

    if (collisions.length > 0) {
        console.warn(`\n⚠️  ${collisions.length} command name collision(s) — the overwritten commands are unreachable:`);
        collisions.forEach(line => console.warn(line));
        console.warn('');
    }

    return commands;
};
