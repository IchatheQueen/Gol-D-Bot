import { Message, Client, EmbedBuilder } from 'discord.js';
import { Command } from '../../handlers/commandHandler';
import { getUserColor } from '../../database/userColor';

const command: Command = {
    name: 'shortcuts',
    description: 'View available shortcuts',
    execute: async (message: Message, args: string[], client: Client) => {
        const embed = new EmbedBuilder()
            .setTitle('📝 Shortcuts')
            .setDescription('Use `~shortcuts` to see shortcuts!')
            .setColor(getUserColor(message.author.id))
            .addFields(
                {
                    name: 'Digits (&)',
                    value: 'To buy a amount when you are lazy to type a bunch of zeros, use & to replace them.\n' +
                        'Format: `number`&`digits` (The [digits] slot should represent the total amount of numbers, not the total amount of zeros)\n' +
                        'e.g.\n' +
                        '`~buy 2 10000` = `~buy 2 1&5` = buying 1x10^5 beer\n' +
                        '`~buy 2 1234560000` = `~buy 2 123456&10` = buying 1.23456x10^9 beer',
                    inline: false
                },
                {
                    name: '"All" phrases',
                    value: '💵 `allmoney`, 🍺 `allbeer`, 🌿 `allweed`, 💊 `allopioid`, 💎 `allster`, 🌱 `allcan`, 🌹 `allopi`, 🌾 `allcot`, 🌿 `alllin`',
                    inline: false
                },
                {
                    name: 'Players',
                    value: 'A phrase to represent "yourself": Use `myid` instead of @yourself\n' +
                        'A phrase to represent somebody else: Check shortcuts channel',
                    inline: false
                },
                {
                    name: 'Cat Stats in `~train`, `~decondition`, `~improve`, `~rollback`',
                    value: 'Only the first 3 letters is required.\n' +
                        'e.g. Potency -> `pot`, so `~improve pot 5` is a working command',
                    inline: false
                },
                {
                    name: 'Consumables in `~feed`, `~dose`',
                    value: 'Coffee -> `c`\n' +
                        'Opioid -> `opi`\n' +
                        'Steroid -> `ster`\n' +
                        'Energy drink -> `ene`\n' +
                        'Pill -> `p`',
                    inline: false
                },
                {
                    name: 'Other shortcuts',
                    value: '`~balance`/`~money` -> `~bal`\n' +
                        '`~blackmarket` -> `~bm`\n' +
                        '`~shop` -> `~pub`\n' +
                        '`~generator` -> `~gen`\n' +
                        '`~exch 001` -> `~exch 1`',
                    inline: false
                }
            );

        message.reply({ embeds: [embed] });
    },
};

export default command;
