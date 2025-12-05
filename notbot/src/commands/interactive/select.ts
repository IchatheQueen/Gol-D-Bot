import { Message, Client, EmbedBuilder } from 'discord.js';
import db from '../../database/db';
import { updateUser, getUser } from '../../database/economy';
import { Command } from '../../handlers/commandHandler';
import { getInventoryItem } from '../../database/inventory';

const command: Command = {
    name: 'select',
    description: 'Select a weapon to use',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;
        const weaponName = args[0]?.toLowerCase();

        if (!weaponName) {
            message.reply('The types of weapons are `crossbow`, `pistol`, `rifle`, `speaker`, `flame` and `laser`');
            return;
        }

        // Map common names/aliases
        const weaponMap: { [key: string]: string } = {
            'pistol': 'pistol',
            'rifle': 'rifle',
            'crossbow': 'crossbow',
            'bow': 'crossbow',
            'speaker': 'speaker',
            'flamethrower': 'flamethrower',
            'flame': 'flamethrower',
            'laser': 'laser'
        };

        const weaponId = weaponMap[weaponName];

        if (!weaponId) {
            message.reply('Invalid weapon! Available: pistol, rifle, crossbow, speaker, flamethrower, laser');
            return;
        }

        // Check if user owns the weapon
        // Map weapon names to item IDs in inventory
        const weaponItemIds: { [key: string]: string } = {
            'crossbow': '7',
            'rifle': '9',
            'speaker': '11',
            'flamethrower': '12',
        };

        if (weaponId !== 'pistol') {
            if (weaponId === 'laser') {
                // Check if user has a pet (laser is pet ability)
                const petCheck = await db.execute({
                    sql: 'SELECT * FROM pets WHERE user_id = ?',
                    args: [userId]
                });
                const pet = petCheck.rows[0] as any;
                if (!pet) {
                    message.reply('You need a cat to use the laser!');
                    return;
                }
            } else {
                const itemId = weaponItemIds[weaponId];
                const amount = await getInventoryItem(userId, itemId);

                if (amount < 1n) {
                    const weaponNames: { [key: string]: string } = {
                        'crossbow': 'Crossbow',
                        'rifle': 'Rifle',
                        'speaker': 'Speaker',
                        'flamethrower': 'Flamethrower',
                    };
                    message.reply(`You don't own a ${weaponNames[weaponId]}! Buy it from the Pub (\`~pub\`).`);
                    return;
                }
            }
        }

        // Ensure user exists in database before updating
        await getUser(userId);
        await updateUser(userId, { selected_weapon: weaponId });

        const weaponDisplayNames: { [key: string]: string } = {
            'pistol': 'Pistol',
            'crossbow': 'Crossbow',
            'rifle': 'Rifle',
            'speaker': 'Speaker',
            'flamethrower': 'Flamethrower',
            'laser': 'Laser',
        };

        const embed = new EmbedBuilder()
            .setTitle('🔫 Weapon Selected')
            .setDescription(`You have equipped your **${weaponDisplayNames[weaponId] || weaponId}**!`)
            .setColor('#00ff00');

        message.reply({ embeds: [embed] });
    },
};

export default command;
