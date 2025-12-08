import { Message, Client, EmbedBuilder } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';
import { getSkin } from '../../data/catSkins';
import { updatePetStats, isPetDead } from '../../utils/petUtils';

const createPet = async (userId: string) => {
    await db.execute({
        sql: 'INSERT INTO pets (user_id) VALUES (?)',
        args: [userId]
    });
};

const command: Command = {
    name: 'cat',
    description: 'Check your cat status',
    aliases: ['petstats'],
    execute: async (message: Message, args: string[], client: Client) => {
        let pet = await updatePetStats(message.author.id);

        if (!pet) {
            await createPet(message.author.id);
            pet = (await updatePetStats(message.author.id))!;
            message.reply('You adopted a new cat!');
        }

        const skinId = pet.skin_id || 0;
        const skin = getSkin(skinId) || getSkin(0)!;

        const DEFAULTS = {
            hunger: '🌯',
            thirst: '<:drink:1447325703136870524>',
            energy: '🔋',
            health: '<:health:1447325679283601438>',
            experience: '☄️',
            credits: '🍥',
            strength: '🔥',
            agility: '⚡',
            intellect: '😎',
            endurance: '👱‍♀️',
            metabolism: '🍖'
        };

        const e = { ...DEFAULTS, ...(skin.statEmojis || {}) };

        const embed = new EmbedBuilder()
            .setTitle(`[Lvl ${pet.level}] ${pet.name}`)
            .setDescription(`Tamed by ${message.author.username}\n\`~cat help\` to get help with your cat`)
            .setColor('#2f3136') // Dark theme color
            .setImage(skin.image)
            .addFields(
                { name: 'Vitals', value: `${e.hunger} Hunger - ${pet.hunger}/100\n${e.thirst} Thirst - ${pet.thirst}/100\n${e.energy} Energy - ${pet.energy}/100\n${e.health} Health - ${pet.health}/${pet.max_health}`, inline: false },
                { name: 'Stats', value: `${e.experience} Experience - ${pet.experience}/400\n${e.credits} Credits - ${pet.credits}\n${e.strength} Strength - ${pet.strength} (1)\n${e.agility} Agility - ${pet.agility} (1)\n${e.intellect} Intellect - ${pet.intellect} (1)\n${e.endurance} Endurance - ${pet.endurance} (1)\n${e.metabolism} Metabolism - ${pet.metabolism} (1)`, inline: false }
            )
            .setFooter({ text: 'Spice up your cat with a cosmetic skin via ~catalias', iconURL: 'https://i.imgur.com/wSTFkRM.png' });

        message.reply({ embeds: [embed] });
    },
};

export default command;
