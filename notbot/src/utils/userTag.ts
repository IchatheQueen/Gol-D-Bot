import { Message, User } from 'discord.js';

/**
 * The house format for naming a player: display name, then their handle.
 *
 *   goon (@theslotgooner2)
 *
 * Used in embed titles ("... 's balance", "... 's Tipped Arrows") and in
 * action lines ("goon (@theslotgooner2) has opened fire on ..."). Falls back
 * to the username when there is no guild member (e.g. in DMs).
 */
export function userTag(message: Message, user?: User): string {
    const target = user ?? message.author;
    const member = message.guild?.members.cache.get(target.id);
    const displayName = member?.displayName || target.username;
    return `${displayName} (@${target.username})`;
}

/**
 * Same format for a target resolved to a bare { id, username } — as
 * resolveTarget returns — where no User object is on hand.
 */
export function userTagById(message: Message, id: string, username: string): string {
    const member = message.guild?.members.cache.get(id);
    const displayName = member?.displayName || username;
    return `${displayName} (@${username})`;
}
