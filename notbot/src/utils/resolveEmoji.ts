import { Client } from 'discord.js';

/**
 * Resolves an emoji from the client's cache by name or ID.
 * If not found, returns the fallback (default: parsed emoji or '📦').
 */
export function resolveEmoji(plugin: Client, emojiKey?: string, fallback: string = '📦'): string {
    if (!emojiKey) return fallback;

    // If it's already a formatted custom emoji (e.g. <:name:id> or <a:name:id>), return it directly.
    if (/^<a?:[a-zA-Z0-9_]+:\d{17,19}>$/.test(emojiKey)) {
        return emojiKey;
    }

    // If it's a standard unicode emoji (basic check) - assume we want to use it directly
    // UNLESS the user passed it as a key to look up (unlikely for unicode chars)
    // But if we want to allow overriding '🔫', we shouldn't return immediately if it matches unicode regex.
    // However, emoji names usually aren't unicode.
    // Let's stick to: if it looks like unicode, it IS the fallback usually.
    // But the user might want to use 'pistol' as key.

    // Check overrides first
    const overrides = (plugin as any).emojiOverrides;
    if (overrides && overrides.has(emojiKey)) {
        return overrides.get(emojiKey);
    }

    // Try finding by ID
    if (/^\d{17,19}$/.test(emojiKey)) {
        const emoji = plugin.emojis.cache.get(emojiKey);
        if (emoji) return emoji.toString();
        // Fallback: If it looks like an ID but not in cache, try constructing it anyway.
        // This allows cross-server emojis if the bot really has access but cache missed.
        return `<:custom:${emojiKey}>`;
    }

    // Try finding by name
    const emoji = plugin.emojis.cache.find(e => e.name === emojiKey);
    if (emoji) {
        return emoji.toString();
    }

    // If it was already unicode, return it.
    if (/\p{Extended_Pictographic}/u.test(emojiKey)) {
        return emojiKey;
    }

    return fallback;
}
