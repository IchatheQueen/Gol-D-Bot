import { Client, GatewayIntentBits, Events, Message as DiscordMessage } from 'discord.js';
import dotenv from 'dotenv';
import db, { initDatabase } from './database/db';
import { processShortcuts } from './utils/shortcuts';
import { incrementCommandCount } from './commands/utility/stats';
import fs from 'fs';
import path from 'path';

dotenv.config();

interface ExtendedClient extends Client {
    activeWalletDrops: Map<string, { amount: number; timestamp: number; claimedBy?: string }>;
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
}) as ExtendedClient;

const PREFIX = '~';
const COOLDOWN_MS = 5000; // 5 seconds
const EXEMPT_USER_ID = '1331780893995565148';
const WALLET_DROP_CHANCE = 0.02; // 2% chance per message

// Store last command timestamp per user
const userCooldowns = new Map<string, number>();

// Store active wallet drop per channel (attach to client so grab command can access)
client.activeWalletDrops = new Map<string, { amount: number; timestamp: number; claimedBy?: string }>();

import { loadCommands } from './handlers/commandHandler';

const commands = loadCommands(client);

// Check if user is blacklisted
async function isBlacklisted(userId: string): Promise<boolean> {
    const result = await db.execute({
        sql: 'SELECT * FROM blacklist WHERE user_id = ?',
        args: [userId]
    });
    return result.rows.length > 0;
}

// Check if user is stunned and return remaining time
async function getStunTimeRemaining(userId: string): Promise<number | null> {
    const result = await db.execute({
        sql: 'SELECT * FROM stuns WHERE user_id = ? AND expires_at > ?',
        args: [userId, Date.now()]
    });
    const row = result.rows[0] as any;
    if (row) {
        return Number(row.expires_at) - Date.now();
    }
    return null;
}

client.once(Events.ClientReady, async (c: any) => {
    console.log(`Ready! Logged in as ${c.user.tag}`);
});

client.on(Events.MessageCreate, async (message: DiscordMessage) => {
    if (message.author.bot) return;
    console.log(`Received message from ${message.author.tag}: ${message.content}`);

    // Check if user is blacklisted (silently ignore)
    if (await isBlacklisted(message.author.id)) {
        return;
    }

    // Check if user is stunned (show message with time remaining)
    if (message.content.startsWith(PREFIX)) {
        const stunTimeRemaining = await getStunTimeRemaining(message.author.id);
        if (stunTimeRemaining !== null) {
            const minutes = Math.floor(stunTimeRemaining / 60000);
            const seconds = Math.floor((stunTimeRemaining % 60000) / 1000);
            message.reply(`⛓️ You are still stunned! Time remaining: **${minutes}m ${seconds}s**`);
            return;
        }
    }

    // Random wallet drop (only for non-command messages)
    if (!message.content.startsWith(PREFIX)) {
        if (Math.random() < WALLET_DROP_CHANCE && !client.activeWalletDrops.has(message.channel.id)) {
            const amount = Math.floor(Math.random() * 900000000000) + 100000000000; // 100B - 1T
            const scenarios = [
                "A snobby old lady dropped their purse, exposing their wallet!",
                "A rich kid tripped and their wallet fell out!",
                "An employee's briefcase opened, revealing a wallet!",
                "A wallet mysteriously appeared on the ground!",
            ];
            const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];

            client.activeWalletDrops.set(message.channel.id, { amount, timestamp: Date.now() });

            await (message.channel as any).send(`${scenario} \`~grab\` to quickly steal it.`);

            // Auto-clear after 30 seconds
            setTimeout(() => {
                client.activeWalletDrops.delete(message.channel.id);
            }, 30000);
        }
        return;
    }

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const commandName = args.shift()?.toLowerCase();
    if (!commandName) return;

    // Process shortcuts in arguments
    const processedArgs = processShortcuts(args, message.author.id);

    // Check cooldown (skip for exempt user and specific commands)
    const exemptCommands = ['retreat', 'select', 'shoot'];
    if (message.author.id !== EXEMPT_USER_ID && !exemptCommands.includes(commandName)) {
        const now = Date.now();
        const lastCommand = userCooldowns.get(message.author.id) || 0;
        const timeLeft = lastCommand + COOLDOWN_MS - now;

        if (timeLeft > 0) {
            // User is on cooldown
            return; // Silently ignore
        }

        // Update cooldown
        userCooldowns.set(message.author.id, now);
    }

    const command = commands.get(commandName);
    if (command) {
        try {
            await command.execute(message, processedArgs, client);
            incrementCommandCount();
        } catch (error) {
            console.error(error);
            const { EmbedBuilder } = require('discord.js');
            const errorEmbed = new EmbedBuilder()
                .setDescription('oopsie we had a fuckie wuckie take a scweenshot and send it to master icha and she will fix it right up')
                .setImage('https://media1.tenor.com/m/nS4DBv28et8AAAAd/boy-girl.gif')
                .setColor('#ff69b4');
            await message.reply({ embeds: [errorEmbed] });
        }
    }
});

// Initialize database and start bot
async function main() {
    try {
        await initDatabase();
        console.log('Database initialized successfully!');
        await client.login(process.env.BOT_TOKEN);
    } catch (error) {
        console.error('Failed to start bot:', error);
        process.exit(1);
    }
}

main();
