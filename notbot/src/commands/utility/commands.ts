
import { Message, Client, EmbedBuilder } from 'discord.js';
import { Command } from '../../handlers/commandHandler';
import { getUserColor } from '../../database/userColor';

const command: Command = {
    name: 'commands',
    description: 'List of all available commands',
    execute: async (message: Message, args: string[], client: Client) => {
        const embed = new EmbedBuilder()
            .setTitle('Commands')
            .addFields(
                { name: 'Economy', value: '`~balance`, `~pay`, `~vault`, `~grab`, `~steal`, `~buy`, `~bm`, `~exch`' },
                { name: 'Games', value: '`~slots`, `~coinflip`, `~roll`, `~pub`, `~slotsprizes`' },
                { name: 'Interactive', value: '`~cat`, `~pet`, `~petshop`, `~feed`, `~train`, `~protect`, `~hunt`, `~target`, `~attack`, `~retreat`' },
                { name: 'Items & Combat', value: '`~ammo`, `~select`, `~shoot`, `~tipped`, `~open`, `~farm`, `~smoke`, `~dose`, `~drink`' },
                { name: 'Premium', value: '`~dshop`, `~dcred`, `~dpay`, `~dbuy`, `~ditems`' },
                { name: 'Utility', value: '`~help`, `~stats`, `~ping`, `~shortcuts`, `~id`' }
            )
            .setFooter({ text: 'Use ~help <command> for more info' });

        await message.reply({ embeds: [embed] });
    },
};

export default command;
