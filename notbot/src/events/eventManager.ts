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
const MIN_INTERVAL = 60 * 60 * 1000; // 1 Hour
const EVENT_DURATION = 15 * 60 * 1000; // 15 Mins

export async function startEventLoop(client: Client) {
    console.log('Starting Event Loop...');

    // Check every minute
    setInterval(() => {
        checkEventStatus(client);
    }, 60 * 1000);
}

async function checkEventStatus(client: Client) {
    const now = Date.now();

    // Check if event is running
    if (eventState.currentEvent !== 'NONE') {
        if (now > eventState.startTime + eventState.duration) {
            // End Event
            const endedEvent = eventState.currentEvent;
            eventState.currentEvent = 'NONE';

            // Broadcast End
            // Assuming 'general' or specific channel. For now, we iterate guilds or use a config.
            // Simplified: console log. In production, broadcast to a system channel.
            console.log(`Event ${endedEvent} ended.`);
        }
        return;
    }

    // Try starting new event (Random chance or strict interval?)
    // Let's do random chance each minute if enough time passed? 
    // Simplified: 10% chance every check if cooldown passed (not implemented here per se, just random)
    if (Math.random() < 0.05) { // 5% chance per minute ~ every 20 mins
        startRandomEvent(client);
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

    // Broadcast to all known text channels? Too spammy.
    // Just find "general" in guilds?
    client.guilds.cache.forEach(guild => {
        const channel = guild.channels.cache.find(c => c.name === 'general' && c.isTextBased()) as TextChannel;
        if (channel) {
            channel.send({ embeds: [embed] }).catch(() => { });
        }
    });

    console.log(`Started Event: ${event}`);
}

export function getEventMultiplier(type: 'DROP_RATE' | 'XP'): number {
    if (eventState.currentEvent === 'GOLD_RUSH' && type === 'DROP_RATE') return 2.0;
    if (eventState.currentEvent === 'XP_BOOST' && type === 'XP') return 2.0;
    return 1.0;
}
