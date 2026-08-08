import { ChatInputCommandInteraction, SlashCommandBuilder, Client } from 'discord.js';
import profile from './profile';
import badges from './badges';
import titles from './titles';
import help from './help';

export interface SlashCommand {
    data: SlashCommandBuilder | any;
    execute: (interaction: ChatInputCommandInteraction, client: Client) => Promise<void>;
}

/**
 * Slash commands are deliberately limited to the profile/cosmetic surface.
 * Everything else stays message-based — this mirrors the reference bot, where
 * slash exists only because profiles need it.
 */
export const slashCommands: SlashCommand[] = [profile, badges, titles, help];

export const slashCommandMap = new Map<string, SlashCommand>(
    slashCommands.map(c => [c.data.name, c])
);
