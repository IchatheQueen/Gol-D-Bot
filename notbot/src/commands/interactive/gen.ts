import { Message, Client, EmbedBuilder, AttachmentBuilder } from 'discord.js';
import db from '../../database/db';
import { Command } from '../../handlers/commandHandler';
import { getInventoryItem, addInventoryItem } from '../../database/inventory';
import { formatBigNumber, parseBigNumber } from '../../utils/bigNumbers';
import { resolveTarget } from '../../utils/resolveTarget';

// config
const BASE_LEVEL_COST = 1000n;
const COST_MULTIPLIER = 1.5; // Exponential growth

const command: Command = {
    name: 'gen',
    description: 'Cat Pill Generator',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;
        const subCommand = args[0]?.toLowerCase();

        // Fetch Generator Data
        let genRes = await db.execute({ sql: 'SELECT * FROM generators WHERE user_id = ?', args: [userId] });

        if (genRes.rows.length === 0) {
            await db.execute({ sql: 'INSERT INTO generators (user_id) VALUES (?)', args: [userId] });
            genRes = await db.execute({ sql: 'SELECT * FROM generators WHERE user_id = ?', args: [userId] });
        }

        const gen = genRes.rows[0] as any;

        // Calculate needed for level up: 900 * 3^(level-1)
        let cost = 900n;
        for (let i = 1; i < gen.level; i++) {
            cost = cost * 3n;
        }

        const totalInvested = BigInt(gen.invested || '0');
        const needed = cost - totalInvested;

        if (!subCommand || subCommand === 'help' || subCommand === 'status') {
            // Stats
            const healthVal = 12 * gen.health_level;
            const hungerVal = 9 * gen.hunger_level;
            const thirstVal = 15 * gen.thirst_level;
            const energyVal = 12 * gen.energy_level;

            const strengthVal = `${(1 + gen.strength_level)}x`;
            const agilityVal = `${(1 + gen.agility_level)}x`;
            const intellectVal = `${(1 + gen.intellect_level)}x`;
            const enduranceVal = `${(1 + gen.endurance_level)}x`;

            const potencyTime = 20 + gen.potency_level; // Example scaling
            const efficiencyRange = `${gen.efficiency_level}-${gen.efficiency_level * 2}`;

            const embed = new EmbedBuilder()
                .setTitle('🗜️ | Cat Pill Generator')
                .setDescription(`Built by ${message.author.username} (@${message.author.username})\n\`GAYgen help\` for some help`)
                .setColor('#2b2d31')
                .addFields(
                    {
                        name: 'Base',
                        value: `💫 Level - ${gen.level}\n💰 Invested - 💵 ${formatBigNumber(totalInvested)} (${totalInvested.toString().length} digits)\n└ 💵 ${formatBigNumber(needed > 0n ? needed : 0n)} (${(needed > 0n ? needed : 0n).toString().length} digits) needed for level up`,
                        inline: false
                    },
                    {
                        name: 'Stats',
                        value: `🏵️ Credits - ${gen.credits}\n` +
                            `💥 Potency - ${gen.potency_level} [${potencyTime} minutes]\n` +
                            `⏲️ Efficiency - ${gen.efficiency_level} [${efficiencyRange} pills produced each time]\n` +
                            `❤️ Health - ${gen.health_level} [❤️ ${healthVal}]\n` +
                            `💊 Hunger - ${gen.hunger_level} [💊 ${hungerVal}]\n` +
                            `💧 Thirst - ${gen.thirst_level} [💧 ${thirstVal}]\n` +
                            `🔋 Energy - ${gen.energy_level} [🔋 ${energyVal}]\n` +
                            `🔥 Strength - ${gen.strength_level} [${strengthVal}]\n` +
                            `⚡ Agility - ${gen.agility_level} [${agilityVal}]\n` +
                            `😎 Intellect - ${gen.intellect_level} [${intellectVal}]\n` +
                            `🧔 Endurance - ${gen.endurance_level} [${enduranceVal}]`,
                        inline: false
                    }
                );

            message.reply({ embeds: [embed] });
            return;
        }

        // Subcommands (invest, improve, etc. are moved to separate files for modularity, but gen -h can show help)
        if (subCommand === 'help') {
            message.reply('Usage:\n`~fund <amount>` - Invest money\n`~improve <stat> <amount>` - Use credits\n`~dispense` - Collect pills\n`~rollback <stat> <amount>` - Refund stats');
        }
    },
};

export default command;
