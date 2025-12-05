
import { Message, Client, EmbedBuilder } from 'discord.js';
import { Command } from '../../handlers/commandHandler';
import { getUserColor } from '../../database/userColor';

const command: Command = {
    name: 'commands',
    description: 'List of all available commands',
    execute: async (message: Message, args: string[], client: Client) => {
        const embed = new EmbedBuilder()
            .setTitle('Commands')
            .setDescription('Here is a list of all available commands:')
            .addFields(
                { name: 'Economy', value: '`~balance`, `~deposit`, `~withdraw`, `~pay`, `~vault`, `~shop`, `~buy`, `~sell`, `~give`, `~bm`, `~exch`' },
                { name: 'Games', value: '`~slots`, `~coinflip`, `~blackjack`, `~pub`' },
                { name: 'Interactive', value: '`~pet`, `~attack`, `~hunt`, `~train`, `~target`, `~retreat`, `~protect`, `~dispense`, `~feed`, `~petshop`, `~gbuy`' },
                { name: 'Items & Farming', value: '`~inv`, `~item`, `~use`, `~ammo`, `~briefcases`, `~open`, `~steal`, `~farm`, `~harvest`, `~smoke`, `~dose`' },
                { name: 'Utility', value: '`~help`, `~stats`, `~ping`, `~id`, `~owner`, `~shortcuts`' }
            )
            .setFooter({ text: 'Use ~help <command> for more info' });

        await message.reply({ embeds: [embed] });
    },
};

export default command;
