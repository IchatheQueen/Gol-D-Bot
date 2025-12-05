import { Message, Client, EmbedBuilder } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';

interface Pet {
    user_id: string;
    name: string;
    health: number;
    max_health: number;
    hunger: number;
    thirst: number;
    energy: number;
    happiness: number;
    level: number;
    experience: number;
    credits: number;
    strength: number;
    agility: number;
    intellect: number;
    endurance: number;
    metabolism: number;
}

const getPet = async (userId: string): Promise<Pet | undefined> => {
    const result = await db.execute({
        sql: 'SELECT * FROM pets WHERE user_id = ?',
        args: [userId]
    });
    return result.rows[0] as any;
};

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
        let pet = await getPet(message.author.id);

        if (!pet) {
            await createPet(message.author.id);
            pet = (await getPet(message.author.id))!;
            message.reply('You adopted a new cat!');
        }

        const embed = new EmbedBuilder()
            .setTitle(`[Lvl ${pet.level}] ${pet.name}`)
            .setDescription(`Tamed by ${message.author.username}\n\`~cat help\` to get help with your cat`)
            .setColor('#2f3136') // Dark theme color
            .addFields(
                { name: 'Vitals', value: `🌯 Hunger - ${pet.hunger}/100\n💧 Thirst - ${pet.thirst}/100\n🔋 Energy - ${pet.energy}/100\n💖 Health - ${pet.health}/${pet.max_health}`, inline: false },
                { name: 'Stats', value: `💧 Experience - ${pet.experience}/400\n🍥 Credits - ${pet.credits}\n🔥 Strength - ${pet.strength} (1)\n⚡ Agility - ${pet.agility} (1)\n😎 Intellect - ${pet.intellect} (1)\n👱‍♀️ Endurance - ${pet.endurance} (1)\n🍖 Metabolism - ${pet.metabolism} (1)`, inline: false }
            )
            .setFooter({ text: 'Spice up your cat with a cosmetic skin via ~market', iconURL: 'https://i.imgur.com/wSTFkRM.png' }); // Placeholder icon

        message.reply({ embeds: [embed] });
    },
};

export default command;
