import { EmbedBuilder, ColorResolvable } from 'discord.js';

const COLORS = {
    SUCCESS: '#FFD700' as ColorResolvable, // Gold
    ERROR: '#FF0055' as ColorResolvable,   // Pinkish Red
    INFO: '#0099FF' as ColorResolvable,    // Blue
    DEFAULT: '#2F3136' as ColorResolvable  // Dark Gray
};

export const EmbedUtils = {
    success: (description: string, title?: string) => {
        return new EmbedBuilder()
            .setColor(COLORS.SUCCESS)
            .setTitle(title || null)
            .setDescription(`✅ ${description}`);
    },

    error: (description: string, title?: string) => {
        return new EmbedBuilder()
            .setColor(COLORS.ERROR)
            .setTitle(title || null)
            .setDescription(`❌ ${description}`)
            .setFooter({ text: 'Use ~help for commands' }); // Standard footer
    },

    info: (description: string, title?: string) => {
        return new EmbedBuilder()
            .setColor(COLORS.INFO)
            .setTitle(title || null)
            .setDescription(`ℹ️ ${description}`);
    },

    basic: (description: string, title?: string, color: ColorResolvable = COLORS.DEFAULT) => {
        return new EmbedBuilder()
            .setColor(color)
            .setTitle(title || null)
            .setDescription(description);
    }
};
