import { Message, Client, EmbedBuilder } from 'discord.js';
import { Command } from '../../handlers/commandHandler';
import { getUserColor } from '../../database/userColor';

const command: Command = {
    name: 'dinfo',
    description: 'View information about donator items',
    execute: async (message: Message, args: string[], client: Client) => {
        const embed = new EmbedBuilder()
            .setTitle('Donator Items')
            .setDescription('`~donate` for instructions on purchasing credit\n`~dshop` to shop for these items')
            .setColor(getUserColor(message.author.id));

        // Statistician
        embed.addFields({
            name: '📊 Statistician',
            value: [
                '• `~stocks`',
                '• `~purchase <amount> <type>` (this is for buying stocks)',
                '• `~shares` (your stock shares)',
                '• `~sell <amount> <type>` (this is for selling stocks)',
                '• `~calc <calculation>`; the bot will automatically round down any decimals so for example `~calc allmoney / 10000` would calculate the total amount of beer I could buy because each beer requires at least 10000 to buy. This feature may also be used in other commands using "calc <calculation". For example, `~pay @User#1234 "calc allmoney / 2"` will pay User#1234 half of your money',
            ].join('\n'),
        });

        // Conjuror
        embed.addFields({
            name: '🪄 Conjuror',
            value: [
                '• `~hex <user>` (steals their money and stuns them; 12 hour cooldown)',
                '• `~color <colorcode>` (changes your color preference)',
                '• Overrides 5-second cooldown',
            ].join('\n'),
        });

        // Junkie
        embed.addFields({
            name: '🚬 Junkie',
            value: [
                '• Half cooldown on steroids and opioids',
                '• 10% chance of zero cooldown on `~smoke`',
                '• Access to `~scrap`',
                '• Feeding cooldown reduced by 25%',
                '• Hunt cooldown lowered to 12 seconds',
            ].join('\n'),
        });

        // Investor
        embed.addFields({
            name: '💰 Investor',
            value: '• `~interest` (increases your balance by 10%; 12 hour cooldown)',
        });

        // Seagull
        embed.addFields({
            name: '🕊️ Seagull',
            value: 'A feature that generates messages for nonexistent commands. For example, `~asdf @@leahislit jkl` results in "Author#1234 has asdfed @@leahislit jkl". However, it does come with some limitations.',
        });

        // Seagull limitations
        embed.addFields({
            name: 'Seagull limitations',
            value: [
                '• English grammar is nuanced and the bot is far from replicating it perfectly. If you do something simple like `~kick <user>`, the bot will correctly respond that you have "kicked" the user. However, if you do something like `~tear <user> apart`, the bot will give you something weird like "tearred <user> apart".',
                '• The command doesn\'t always work. Namely, it won\'t work if the command you\'re trying to do already exists as a custom command which a lot of keywords do. This isn\'t intentional and I hope to fix this someday.',
                '• The verb has to be the last word of the verb phrase. So if you do `~bitch slap <user>`, the message will say "bitch slapped" but if you do `~make out with <user>`, the message will be "make out withed" which doesn\'t make sense.',
            ].join('\n'),
        });

        message.reply({ embeds: [embed] });
    },
};

export default command;
