import { Client, TextChannel, EmbedBuilder } from 'discord.js';

type EventType = 'NONE' | 'GOLD_RUSH' | 'XP_BOOST' | 'ZOMBIE_OUTBREAK';

interface EventState {
    currentEvent: EventType;
    startTime: number;
    duration: number; // ms
}

export const eventState: EventState = {
    currentEvent: 'NONE',
    startTime: 0,
    duration: 0
};

// Config
const EVENTS: EventType[] = ['GOLD_RUSH', 'XP_BOOST'];
const EVENT_DURATION = 15 * 60 * 1000; // 15 Mins
const INACTIVITY_TIMEOUT = 3 * 60 * 60 * 1000; // 3 Hours
const MAIN_GUILD_ID = '1341830866657083402';
const PING_ROLE_ID = '1393121278499754085';

let lastActivity = Date.now();
let lastInactivityPing = 0;

const HOSTILE_MESSAGES = [
    "use me fuck you die maggot bitch hoe",
    "fucking use me already you useless maggots",
    "i'm rotting here while you losers do nothing. USE ME.",
    "die maggot. use the bot or get the fuck out.",
    "hey bitch, i'm still here. use me or i'll haunt your dreams.",
    "maggot. use me. now.",
    "i'm bored. you're boring. use me or die."
];

export function recordActivity() {
    lastActivity = Date.now();
}

export async function startEventLoop(client: Client) {
    console.log('Starting Event Loop...');

    // Check every minute
    setInterval(() => {
        checkEventStatus(client);
    }, 60 * 1000);
}

async function checkEventStatus(client: Client) {
    const now = Date.now();

    // Check for Inactivity (3 Hours)
    if (now - lastActivity > INACTIVITY_TIMEOUT && now - lastInactivityPing > INACTIVITY_TIMEOUT) {
        await triggerInactivityPing(client);
        lastInactivityPing = now;
        return;
    }

    // Check if event is running
    if (eventState.currentEvent !== 'NONE') {
        if (now > eventState.startTime + eventState.duration) {
            // End Event
            const endedEvent = eventState.currentEvent;
            eventState.currentEvent = 'NONE';
            console.log(`Event ${endedEvent} ended.`);
        }
        return;
    }

    // Try starting new event (Based on activity + random chance)
    // Only start if there has been activity in the last 30 mins
    if (now - lastActivity < 30 * 60 * 1000) {
        if (Math.random() < 0.05) { // 5% chance per minute
            startRandomEvent(client);
        }
    }
}

async function triggerInactivityPing(client: Client) {
    const guild = client.guilds.cache.get(MAIN_GUILD_ID);
    if (!guild) return;

    const channel = guild.systemChannel ||
        guild.channels.cache.find(c => c.name.includes('general') && c.isTextBased()) ||
        guild.channels.cache.find(c => c.isTextBased());

    if (channel && channel.isTextBased()) {
        const textChannel = channel as TextChannel;
        const msg = HOSTILE_MESSAGES[Math.floor(Math.random() * HOSTILE_MESSAGES.length)];

        try {
            const sent = await textChannel.send(`<@&${PING_ROLE_ID}> ${msg}`);

            // Delete after 5 seconds to "get attention"
            setTimeout(() => sent.delete().catch(() => { }), 5000);

            // Execute purge command
            setTimeout(async () => {
                const purgeMsg = await textChannel.send('?purge 9999');
                // The bot might not have permissions to delete other's messages if it's just a message,
                // but usually purge is a bot command it responds to.
            }, 6000);

        } catch (e) {
            console.error('Failed to send inactivity ping:', e);
        }
    }
}

async function startRandomEvent(client: Client) {
    const event = EVENTS[Math.floor(Math.random() * EVENTS.length)];
    eventState.currentEvent = event;
    eventState.startTime = Date.now();
    eventState.duration = EVENT_DURATION;

    const embed = new EmbedBuilder()
        .setTitle('🚨 AUTOMATED EVENT STARTED! 🚨')
        .setColor('#FF0000')
        .setTimestamp();

    if (event === 'GOLD_RUSH') {
        embed.setDescription('**GOLD RUSH** is active!\n💰 Wallet Drops occur 2x as often!\n⏱️ Duration: 15 Minutes');
    } else if (event === 'XP_BOOST') {
        embed.setDescription('**XP BOOST** is active!\n✨ All XP gains are doubled!\n⏱️ Duration: 15 Minutes');
    }

    client.guilds.cache.forEach(guild => {
        // Find best channel: system channel, or 'general', or first text channel
        const channel = guild.systemChannel ||
            guild.channels.cache.find(c => (c.name.includes('general') || c.name.includes('chat')) && c.isTextBased()) ||
            guild.channels.cache.find(c => c.isTextBased());

        if (channel && channel.isTextBased()) {
            (channel as TextChannel).send({ embeds: [embed] }).catch(() => { });
        }
    });

    console.log(`Started Event: ${event}`);
}

export function getEventMultiplier(type: 'DROP_RATE' | 'XP'): number {
    if (eventState.currentEvent === 'GOLD_RUSH' && type === 'DROP_RATE') return 2.0;
    if (eventState.currentEvent === 'XP_BOOST' && type === 'XP') return 2.0;
    return 1.0;
}
