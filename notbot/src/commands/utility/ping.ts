import { Message, Client, EmbedBuilder } from 'discord.js';
import { Command } from '../../handlers/commandHandler';

const command: Command = {
    name: 'ping',
    description: 'Check bot latency',
    execute: async (message: Message, args: string[], client: Client) => {
        const sent = await message.reply('Pinging...');
        const latency = sent.createdTimestamp - message.createdTimestamp;
        const apiLatency = Math.round(client.ws.ping);

        // Shard id makes latency reports actionable — a slow shard is a very
        // different problem from the whole bot being slow.
        const shardId = message.guild?.shardId ?? 0;

        const embed = new EmbedBuilder()
            .setTitle('🏓 Pong!')
            .addFields(
                { name: 'Latency', value: `${latency}ms`, inline: true },
                { name: 'API Latency', value: `${apiLatency}ms`, inline: true },
                { name: 'Shard', value: `#${shardId}`, inline: true }
            )
            .setColor('#2b2d31');

        sent.edit({ content: null, embeds: [embed] });
    },
};

export default command;
