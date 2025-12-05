import { Message, Client } from 'discord.js';

/**
 * Resolves a target user from args - supports:
 * - @mention
 * - Raw user ID
 * - "myid" keyword (returns message author)
 */
export async function resolveTarget(message: Message, args: string[], client: Client, argIndex: number = 0): Promise<{ id: string; username: string } | null> {
    const targetArg = args[argIndex]?.toLowerCase();

    if (!targetArg) {
        return null;
    }

    // Check for "myid" keyword
    if (targetArg === 'myid' || targetArg === 'me') {
        return {
            id: message.author.id,
            username: message.author.username
        };
    }

    // Check for mention
    const mentionedUser = message.mentions.users.first();
    if (mentionedUser) {
        return {
            id: mentionedUser.id,
            username: mentionedUser.username
        };
    }

    // Check for raw user ID (numeric string)
    if (/^\d{17,19}$/.test(targetArg)) {
        try {
            const user = await client.users.fetch(targetArg);
            return {
                id: user.id,
                username: user.username
            };
        } catch {
            // User not found, return just the ID
            return {
                id: targetArg,
                username: targetArg
            };
        }
    }

    return null;
}
