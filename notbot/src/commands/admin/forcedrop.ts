import { Message, Client, EmbedBuilder } from 'discord.js';
import { Command } from '../../handlers/commandHandler';
import { getUserColor } from '../../database/userColor';

const command: Command = {
    name: 'forcedrop',
    description: 'Force a wallet drop in the current channel',
    execute: async (message: Message, args: string[], client: Client) => {
        // Admin check (using the hardcoded ID from index.ts logic for now, or just allow it since it's debug)
        const ADMIN_ID = '1331780893995565148';
        if (message.author.id !== ADMIN_ID) {
            return;
        }

        const amount = Math.floor(Math.random() * 900000000000) + 100000000000; // 100B - 1T
        const scenarios = [
            "A snobby old lady dropped their purse, exposing their wallet!",
            "A rich kid tripped and their wallet fell out!",
            "An employee's briefcase opened, revealing a wallet!",
            "A wallet mysteriously appeared on the ground!",
        ];
        const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];

        (client as any).activeWalletDrops.set(message.channel.id, { amount, timestamp: Date.now() });

        await message.channel.send(`${scenario} \`~grab\` to quickly steal it.`);
        await message.delete().catch(() => { }); // Delete the command message to keep it clean
    },
};

export default command;
