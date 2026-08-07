import { Message, Client } from 'discord.js';

/**
 * Resolves a target user from args - supports:
 * - @mention
 * - Raw user ID
 * - "myid" / "me" keyword (returns message author)
 */
export async function resolveTarget(message: Message, args: string[], client: Client, argIndex: number = 0): Promise<{ id: string; username: string } | null> {
    const targetArg = args[argIndex]?.toLowerCase();

    if (!targetArg) {
        return null;
    }

    // Check for "myid" or "me" keyword
    if (targetArg === 'myid' || targetArg === 'me') {
        return {
            id: message.author.id,
            username: message.author.username
        };
    }

    // Check if targetArg is a mention e.g. <@123456789012345678> or <@!123456789012345678>
    const mentionMatch = targetArg.match(/^<@!?(\d{17,19})>$/);
    if (mentionMatch) {
        const id = mentionMatch[1];
        const user = message.mentions.users.get(id) || await client.users.fetch(id).catch(() => null);
        return {
            id: id,
            username: user ? user.username : id
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
            return {
                id: targetArg,
                username: targetArg
            };
        }
    }

    // Fallback if there's a mention in the message and argIndex matches
    if (message.mentions.users.size > 0 && argIndex === 0) {
        const first = message.mentions.users.first()!;
        return {
            id: first.id,
            username: first.username
        };
    }

    return null;
}

/**
 * Resolves a target user from args, defaulting to the message author if no args are provided.
 */
export async function resolveTargetOrSelf(message: Message, args: string[], client: Client, argIndex: number = 0): Promise<{ id: string; username: string }> {
    const target = await resolveTarget(message, args, client, argIndex);
    if (target) {
        return target;
    }
    return {
        id: message.author.id,
        username: message.author.username
    };
}