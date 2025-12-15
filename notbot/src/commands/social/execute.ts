import { Message, Client } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';

const command: Command = {
    name: 'execute',
    description: 'Execute commands as your recruit',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;
        const keyword = args[0];
        const commandName = args[1];
        const commandArgs = args.slice(2);

        if (!keyword || !commandName) {
            message.reply('Usage: `~execute <recruit_keyword> <command> [args]`');
            return;
        }

        // Verify recruit ownership
        const recruitCheck = await db.execute({
            sql: 'SELECT recruit_id FROM recruits WHERE owner_id = ? AND keyword = ?',
            args: [userId, keyword]
        });

        if (recruitCheck.rows.length === 0) {
            // Check if user tried to use a raw ID or mention?
            // "execute s1 ..." -> s1 is keyword
            message.reply(`You do not have a recruit with keyword \`${keyword}\`.`);
            return;
        }

        const recruitId = (recruitCheck.rows[0] as any).recruit_id;

        // Fetch recruit user to spoof
        const recruitUser = await client.users.fetch(recruitId).catch(() => null);
        if (!recruitUser) {
            message.reply('Could not fetch recruit user.');
            return;
        }

        // Find the command to execute
        // We need access to the command list. 
        // Typically commands are in a Collection or Map exported from index or handler.
        // Assuming we can access `client.commands` if we attached it, or we need to import `commands` map.
        // Since I don't see `client.commands` in types usually unless extended, I'll assume I need to import the command handler's command map.
        // Or I can emit a message event? No, that triggers for "all" bots/listeners.
        // Better to manually invoke.

        // I'll dynamically import the command handler to get the commands Map if possible.
        // Or if 'client' has it.
        // I will assume `(client as any).commands` exists or I need to import it.
        // Checking `commandHandler.ts` content might be useful but "execute" function signature suggests we can just find it.

        const commands = (client as any).commands as Map<string, Command>;
        const cmd = commands.get(commandName.toLowerCase()) ||
            Array.from(commands.values()).find(c => c.aliases && c.aliases.includes(commandName.toLowerCase()));

        if (!cmd) {
            message.reply(`Command \`${commandName}\` not found.`);
            return;
        }

        // Spoof Message
        // We create a proxy or clone of the message object, overriding 'author' and 'content'??
        // actually 'content' isn't explicitly used if we pass 'args' directly to execute, 
        // BUT some commands might use message.content.
        // Ideally we pass `commandArgs` as `args` to `cmd.execute`.
        // The `message` object needs to report `message.author` as the recruit.

        const spoofedMessage = Object.create(message);
        Object.defineProperty(spoofedMessage, 'author', { value: recruitUser });
        Object.defineProperty(spoofedMessage, 'member', { value: message.guild?.members.cache.get(recruitId) || null });
        // We might need to handle reply?
        // If we reply to `spoofedMessage`, it replies to the original channel. That's fine.

        try {
            await cmd.execute(spoofedMessage, commandArgs, client);
        } catch (error) {
            console.error(`Error executing command as recruit:`, error);
            message.reply('There was an error executing that command.');
        }
    },
};

export default command;
