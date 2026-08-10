import { Message, Client, EmbedBuilder } from 'discord.js';
import { Command } from '../../handlers/commandHandler';
import { getUserColor } from '../../database/userColor';
import { events, getActiveEvent, isEventActive, GameEvent } from '../../data/events';
import { getEventCurrency, getCosmetics, purchaseEventItem } from '../../database/events';

/**
 * Mirrors the reference bot's "No Event Active" panel, which lists the whole
 * subcommand surface rather than just pointing at `~event list`.
 */
function noEventEmbed(userId: string) {
    return new EmbedBuilder()
        .setTitle('No Event Active')
        .setDescription(
            '`~event list` to view information about all past announced events.\n' +
            '`~event shop` to view shop items for the active event.\n' +
            '`~event collectables` to view your collected profile collectables.\n' +
            '`~event buy <id> <amount>` to purchase from the event shop.\n\n' +
            'There are no active events happening right now!'
        )
        .setColor(getUserColor(userId));
}

function shopEmbed(event: GameEvent, held: bigint, userId: string) {
    const body = event.shop.map(item =>
        `**[ID: ${item.id}]** ${item.emoji} **${item.name}**\n` +
        `└ Price: ${event.currencyEmoji} ${item.cost}\n` +
        `└ ${item.description}`
    ).join('\n\n');

    return new EmbedBuilder()
        .setTitle(`${event.emoji} ${event.name} — Event Shop`)
        .setDescription(
            `Purchase with \`~event buy <id> [amount]\`\n` +
            `You have ${event.currencyEmoji} **${held}** ${event.currencyName}\n\n${body}`
        )
        .setColor(getUserColor(userId));
}

const command: Command = {
    name: 'event',
    description: 'View the active event, its shop, and your collectables',
    usage: '~event [shop|buy|list|collectables]',
    aliases: ['events'],
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;
        const sub = args[0]?.toLowerCase();

        if (sub === 'list') {
            const embed = new EmbedBuilder()
                .setTitle('📅 GoldBot Events')
                .setDescription(events.map(e => {
                    const active = isEventActive(e) ? ' — 🟢 **Active now**' : '';
                    return `${e.emoji} **${e.name}**${active}\n` +
                        `└ Runs ${e.start[0]}/${e.start[1]} → ${e.end[0]}/${e.end[1]}\n` +
                        `└ Currency: ${e.currencyEmoji} ${e.currencyName}`;
                }).join('\n\n'))
                .setColor(getUserColor(userId));

            message.reply({ embeds: [embed] });
            return;
        }

        if (sub === 'collectables' || sub === 'collectibles') {
            const owned = await getCosmetics(userId);
            const embed = new EmbedBuilder()
                .setTitle(`🎖️ ${message.author.username}'s Event Collectibles`)
                .setColor(getUserColor(userId));

            embed.setDescription(owned.length === 0
                ? "You haven't collected anything from an event yet!"
                : owned.map(c => `• \`${c.cosmetic_id}\` (${c.type}) — from **${c.source}**`).join('\n'));

            message.reply({ embeds: [embed] });
            return;
        }

        const event = getActiveEvent();

        if (sub === 'shop') {
            if (!event) { message.reply({ embeds: [noEventEmbed(userId)] }); return; }
            const held = await getEventCurrency(userId, event);
            message.reply({ embeds: [shopEmbed(event, held, userId)] });
            return;
        }

        if (sub === 'buy') {
            if (!event) { message.reply({ embeds: [noEventEmbed(userId)] }); return; }

            const item = event.shop.find(i => i.id === args[1]);
            if (!item) {
                message.reply('That item does not exist in the event shop! Check `~event shop`.');
                return;
            }

            const amount = args[2] ? parseInt(args[2], 10) : 1;
            if (!Number.isFinite(amount) || amount < 1) {
                message.reply('Please specify a valid amount.');
                return;
            }

            const result = await purchaseEventItem(userId, event, item, amount);

            if (!result.ok) {
                message.reply(result.reason);
                return;
            }

            const quantity = item.stackable ? `${result.amount}x ` : '';
            message.reply({
                embeds: [new EmbedBuilder()
                    .setDescription(`✅ Purchased ${quantity}${item.emoji} **${item.name}**!`)
                    .setColor(getUserColor(userId))],
            });
            return;
        }

        if (!event) { message.reply({ embeds: [noEventEmbed(userId)] }); return; }

        const held = await getEventCurrency(userId, event);
        const perks = event.perks.length ? `\n\n**Event Perks**\n${event.perks.map(p => `• ${p}`).join('\n')}` : '';

        const embed = new EmbedBuilder()
            .setTitle(`${event.emoji} ${event.name}`)
            .setDescription(
                `${event.blurb}\n\n` +
                `You have ${event.currencyEmoji} **${held}** ${event.currencyName}` +
                `${perks}\n\n` +
                '**Recap**\n' +
                '• `~event shop` to browse the themed shop\n' +
                '• `~event buy <id> [amount]` to purchase\n' +
                '• `~event collectibles` to view what you own\n' +
                '• `~event list` to view all events'
            )
            .setFooter({ text: `Runs until ${event.end[0]}/${event.end[1]}` })
            .setColor(getUserColor(userId));

        message.reply({ embeds: [embed] });
    },
};

export default command;
