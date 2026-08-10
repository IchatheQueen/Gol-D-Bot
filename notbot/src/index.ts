// MUST be first: database/db.ts reads TURSO_DATABASE_URL at module load, and
// module imports are evaluated before any statement in this file. Calling
// dotenv.config() further down left that variable undefined, so the client
// silently fell back to the local `file:./slotbot.db` and the bot spent its
// time writing to a different database than the website reads.
import 'dotenv/config';

import { Client, GatewayIntentBits, Events, Message as DiscordMessage, EmbedBuilder, TextChannel } from 'discord.js';
import dotenv from 'dotenv';
import db, { initDatabase } from './database/db';
import { processShortcuts } from './utils/shortcuts';
import { EmbedUtils } from './utils/embeds';
import { loadUserColors } from './database/userColor';
import { matchPrefix, loadUserPrefixes } from './database/userSettings';
import { incrementCommandCount } from './commands/utility/stats';

// import { startEventLoop, getEventMultiplier, recordActivity } from './events/eventManager'; // DELETED
import fs from 'fs';
import path from 'path';

dotenv.config();

interface ExtendedClient extends Client {
    activeWalletDrops: Map<string, { amount: number; timestamp: number; claimedBy?: string }>;
    emojiOverrides: Map<string, string>;
    commands: any;
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers, // Needed for booster detection
    ],
}) as ExtendedClient;

// The default prefix lives in database/userSettings.ts (DEFAULT_PREFIX), since
// prefix resolution is per-user now.
const COOLDOWN_MS = 2000; // 2 seconds, matching SlotBot's global rate limit
const EXEMPT_USER_ID = '1331780893995565148';
const WALLET_DROP_CHANCE = 0.02; // 2% chance per message
const MAIN_GUILD_ID = '1341830866657083402';

// Store last command timestamp per user
const userCooldowns = new Map<string, number>();
const userLsdLastAction = new Map<string, number>();

// Store active wallet drop per channel (attach to client so grab command can access)
client.activeWalletDrops = new Map<string, { amount: number; timestamp: number; claimedBy?: string }>();
client.emojiOverrides = new Map<string, string>();

import { loadCommands } from './handlers/commandHandler';
import { slashCommands, slashCommandMap } from './slash';

/**
 * Registers the profile-system slash commands.
 *
 * Guild-scoped when GUILD_ID is set, because guild commands appear instantly
 * while global ones can take up to an hour to propagate. A failure here is
 * logged rather than thrown — losing /profile should not stop the bot from
 * serving the ~ commands that are the bulk of it.
 */
async function registerSlashCommands(readyClient: Client) {
    try {
        const body = slashCommands.map(c => c.data.toJSON());
        const guildId = process.env.GUILD_ID;

        if (guildId) {
            const guild = await readyClient.guilds.fetch(guildId).catch(() => null);
            if (guild) {
                await guild.commands.set(body);
                console.log(`Registered ${body.length} slash commands to guild ${guildId}.`);
                return;
            }
            console.warn(`GUILD_ID ${guildId} not reachable; falling back to global slash registration.`);
        }

        await readyClient.application?.commands.set(body);
        console.log(`Registered ${body.length} global slash commands (may take up to an hour to appear).`);
    } catch (e) {
        console.error('Failed to register slash commands:', e);
    }
}

const commands = loadCommands(client);
client.commands = commands;

async function getBlacklistRecord(userId: string): Promise<any> {
    const result = await db.execute({
        sql: 'SELECT * FROM blacklist WHERE user_id = ?',
        args: [userId]
    });
    return result.rows[0] || null;
}

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

async function getActiveDrug(userId: string, drugType: string): Promise<any> {
    const result = await db.execute({
        sql: 'SELECT * FROM drug_effects WHERE user_id = ? AND drug_type = ? AND expires_at > ?',
        args: [userId, drugType, Date.now()]
    });
    return result.rows[0] || null;
}

// Load emoji overrides
async function loadEmojiOverrides() {
    try {
        const result = await db.execute('SELECT * FROM emoji_overrides');
        for (const row of result.rows) {
            client.emojiOverrides.set(row.key as string, row.emoji as string);
        }
        console.log(`Loaded ${client.emojiOverrides.size} emoji overrides.`);
    } catch (e) {
        console.error('Failed to load emoji overrides:', e);
    }
}

client.once(Events.ClientReady, async (c: any) => {
    console.log(`Ready! Logged in as ${c.user.tag}`);
    await loadEmojiOverrides();
    await loadUserColors();
    await loadUserPrefixes();
    await registerSlashCommands(c);
    // await startEventLoop(client); // DELETED
});

// Booster Detection
client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
    if (newMember.guild.id !== MAIN_GUILD_ID) return;


    // Check if they just started boosting
    if (!oldMember.premiumSince && newMember.premiumSince) {
        console.log(`${newMember.user.tag} just started boosting! Giving perks...`);

        // Grant Premium perk in DB
        await db.execute({
            sql: 'UPDATE users SET is_premium = 1 WHERE id = ?',
            args: [newMember.id]
        });

        // Optional: Send a thank you message
        const welcomeChannel = newMember.guild.systemChannel;
        if (welcomeChannel) {
            const embed = new EmbedBuilder()
                .setTitle('💎 Server Booster Perk Activated!')
                .setDescription(`Thank you for boosting, ${newMember}! You have been granted **Premium** status on GoldBot. Enjoy your exclusive perks!`)
                .setColor('#f47fff');
            await welcomeChannel.send({ embeds: [embed] });
        }
    }
});

client.on(Events.MessageCreate, async (message: DiscordMessage) => {
    if (message.author.bot) return;

    const userId = message.author.id;
    const blacklistRecord = await getBlacklistRecord(userId);
    if (blacklistRecord) {
        if (matchPrefix(userId, message.content)) {
            const embed = new EmbedBuilder()
                .setTitle('SERVICE RESTRICTION [X9WY64532]')
                .setDescription('Sorry, your account has been permanently blacklisted from interacting with this bot.')
                .addFields({ name: 'Reason', value: blacklistRecord.reason || 'No reason provided.' })
                .setColor('#000000');

            await message.reply({ embeds: [embed] });
        }
        return;
    }

    // Honours the per-user prefix from ~settings prefix; the default always
    // works too, so a bad personal prefix can't lock anyone out.
    const usedPrefix = matchPrefix(userId, message.content);
    if (!usedPrefix) {
        return;
    }

    if (userId !== EXEMPT_USER_ID) {
        const stunTimeRemaining = await getStunTimeRemaining(userId);
        if (stunTimeRemaining !== null) {
            const minutes = Math.floor(stunTimeRemaining / 60000);
            const seconds = Math.floor((stunTimeRemaining % 60000) / 1000);
            message.reply(`⛓️ You are still stunned! Time remaining: **${minutes}m ${seconds}s**`);
            return;
        }
    }

    const args = message.content.slice(usedPrefix.length).trim().split(/ +/);
    const commandName = args.shift()?.toLowerCase();
    if (!commandName) return;

    // LSD Rate Limit & Fail Chance
    const lsdEffect = await getActiveDrug(userId, 'lsd');
    if (lsdEffect) {
        const lastAction = userLsdLastAction.get(userId) || 0;
        const lsdTimeLeft = lastAction + 14000 - Date.now();

        if (lsdTimeLeft > 0) {
            const seconds = Math.ceil(lsdTimeLeft / 1000);
            await (message.channel as any).send(`You must wait ${seconds} seconds before using another GoldBot command as a result of your LSD`);
            return;
        }

        // 1/3 fail chance
        if (Math.random() < 0.33) {
            userLsdLastAction.set(userId, Date.now());
            const displayName = message.guild?.members.cache.get(userId)?.displayName || message.author.username;
            const failEmbed = new EmbedBuilder()
                .setDescription(`${displayName} (@${message.author.username}) has misjudged their surroundings and fallen on their face`)
                .setColor('#2b2d31');
            await message.reply({ embeds: [failEmbed] });
            return;
        }
    }


    // const dropMultiplier = getEventMultiplier('DROP_RATE'); // DELETED
    const dropMultiplier = 1;
    if (Math.random() < (WALLET_DROP_CHANCE * dropMultiplier)) {
        const existingDrop = await db.execute({
            sql: 'SELECT * FROM wallet_drops WHERE channel_id = ?',
            args: [message.channel.id]
        });

        if (existingDrop.rows.length === 0) {
            const amount = Math.floor(Math.random() * 900000000000) + 100000000000;
            const scenarios = [
                "A snobby old lady dropped their purse, exposing their wallet!",
                "A rich kid tripped and their wallet fell out!",
                "An employee's briefcase opened, revealing a wallet!",
                "A wallet mysteriously appeared on the ground!",
                "A bank truck door flew open!"
            ];
            const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];

            await db.execute({
                sql: 'INSERT INTO wallet_drops (channel_id, amount, timestamp) VALUES (?, ?, ?)',
                args: [message.channel.id, amount.toString(), Date.now()]
            });

            await (message.channel as any).send(`${scenario} \`~grab\` to quickly steal it.`);
        }
    }

    const processedArgs = processShortcuts(args, userId);

    const exemptCommands = ['retreat', 'select', 'shoot'];
    if (userId !== EXEMPT_USER_ID && !exemptCommands.includes(commandName)) {
        const now = Date.now();
        const lastCommand = userCooldowns.get(userId) || 0;
        const timeLeft = lastCommand + COOLDOWN_MS - now;

        if (timeLeft > 0) {
            // Premium (Gold / server boosters) skips the global cooldown. The
            // lookup only runs when someone is actually rate limited, so it
            // stays off the per-message hot path.
            let isPremium = false;
            try {
                const premiumCheck = await db.execute({
                    sql: 'SELECT is_premium FROM users WHERE id = ?',
                    args: [userId]
                });
                const row = premiumCheck.rows[0] as any;
                isPremium = Boolean(row && Number(row.is_premium) === 1);
            } catch {
                // Treat lookup failure as non-premium.
            }

            if (!isPremium) {
                // Tell the user rather than silently dropping the command.
                const seconds = Math.ceil(timeLeft / 1000);
                await message.reply(
                    `You must wait ${seconds} second${seconds === 1 ? '' : 's'} before using another command. ` +
                    `Consider getting 🟡 GoldBot Gold (\`~patreon\`) or boost \`~support\` to remove this.`
                );
                return;
            }
        }

        userCooldowns.set(userId, now);
    }

    // Check for alias/skin
    let finalCommandName = commandName;
    let finalArgs = processedArgs;
    let forcedSkinId: number | undefined = undefined;

    try {
        const aliasRecord = await db.execute({
            sql: 'SELECT * FROM command_aliases WHERE alias_name = ?',
            args: [commandName]
        });

        if (aliasRecord.rows.length > 0) {
            const alias = aliasRecord.rows[0] as any;
            finalCommandName = alias.target_command;
            const aliasArgs = alias.arguments ? alias.arguments.split(' ') : [];
            finalArgs = [...aliasArgs, ...processedArgs];

            const skinMap: Record<string, number> = {
                'kitten': 1,
                'warrior': 2,
                'gooner': 69,
                'goon': 69
            };

            if (skinMap[commandName]) {
                const targetSkinId = skinMap[commandName];
                const accessCheck = await db.execute({
                    sql: `
                        SELECT 1 FROM custom_command_ownership WHERE command_name = ? AND owner_id = ?
                        UNION
                        SELECT 1 FROM custom_command_access WHERE command_name = ? AND user_id = ?
                    `,
                    args: [commandName, userId, commandName, userId]
                });

                if (accessCheck.rows.length > 0 || userId === EXEMPT_USER_ID) {
                    forcedSkinId = targetSkinId;
                }
            }
        }
    } catch (err) {
        console.error('Error checking aliases:', err);
    }

    const command = client.commands.get(finalCommandName);
    if (command) {
        try {
            if (command.execute) {
                await command.execute(message, finalArgs, client, forcedSkinId);
                incrementCommandCount();

                // If on LSD, refresh cooldowns AFTER successful execution
                if (lsdEffect) {
                    userLsdLastAction.set(userId, Date.now());
                    const refreshList = [
                        'shoot_pistol', 'shoot_rifle', 'shoot_crossbow', 'shoot_speaker', 'shoot_flamethrower',
                        'hex', 'boost', 'dispense', 'steal', 'decondition'
                    ];
                    for (const cd of refreshList) {
                        await db.execute({
                            sql: 'DELETE FROM cooldowns WHERE user_id = ? AND command = ?',
                            args: [userId, cd]
                        });
                    }
                }
            }
        } catch (error) {
            console.error(error);
            const errorEmbed = EmbedUtils.error(
                'oopsie we had a fuckie wuckie take a scweenshot and send it to master icha and she will fix it right up'
            ).setImage('https://media.tenor.com/V6hW6B7f-jAAAAAC/anime-girl-sorry.gif');

            await message.reply({ embeds: [errorEmbed] });
        }
    }
});

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = slashCommandMap.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction, client);
    } catch (error) {
        console.error(`Slash command /${interaction.commandName} failed:`, error);

        // The interaction may already be acknowledged, in which case replying
        // again throws and loses the original error.
        const payload = { content: 'Something went wrong running that command.', ephemeral: true };
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(payload).catch(() => { });
        } else {
            await interaction.reply(payload).catch(() => { });
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
