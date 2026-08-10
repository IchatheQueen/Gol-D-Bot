import { Message, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { Command } from '../../handlers/commandHandler';
import { getUserColor } from '../../database/userColor';

/**
 * Where a purchase actually completes.
 *
 * The reference bot points ~donate at its store, and fell back to routing
 * people through Patreon when that store broke. There is no storefront wired
 * up here yet, so unless STORE_URL is set the buttons hand the user to the
 * support server rather than inventing a checkout link that goes nowhere.
 */
const STORE_URL = process.env.STORE_URL || null;
const SUPPORT_INVITE = 'https://discord.gg/vCnqckmmW6';

/** Purchasable credit bundles, in whole USD. */
const AMOUNTS = [5, 10, 25, 50, 100];

const command: Command = {
    name: 'donate',
    description: 'Purchase Credit',
    usage: '~donate',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;

        const embed = new EmbedBuilder()
            .setTitle('Purchasing 💎 Credit')
            .setDescription(
                '1. Select an amount below.\n' +
                '📄 Each 💎 **Credit** is equal to **$1.00 USD**\n' +
                '2. You will get checkout instructions in this channel.\n' +
                '3. Once processed, credit is added to your `~dcred`. Enjoy!\n\n' +
                `⚠️ By purchasing you agree to our purchase policies. Having trouble? ` +
                `Join the [Support Server](${SUPPORT_INVITE}) (\`~support\`).`
            )
            .setColor(getUserColor(userId));

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            ...AMOUNTS.map(a => new ButtonBuilder()
                .setCustomId(`donate_${a}`)
                .setLabel(String(a))
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('💎'))
        );

        const reply = await message.reply({ embeds: [embed], components: [row] });

        // Previously these buttons had no handler at all, so every click sat
        // there until Discord timed the interaction out.
        const collector = reply.createMessageComponentCollector({ time: 120000 });

        collector.on('collect', async (i) => {
            if (i.user.id !== userId) {
                await i.reply({ content: 'This purchase is not yours!', ephemeral: true });
                return;
            }

            const amount = Number(i.customId.replace('donate_', ''));
            if (!AMOUNTS.includes(amount)) return;

            const next = STORE_URL
                ? `Open your checkout link: ${STORE_URL}?credits=${amount}`
                : `Open a ticket in the [Support Server](${SUPPORT_INVITE}) and tell staff you want ` +
                  `**${amount} Credit**. They will send you a payment link and apply it to your \`~dcred\`.`;

            await i.reply({
                embeds: [new EmbedBuilder()
                    .setTitle(`💎 ${amount} Credit — $${amount}.00 USD`)
                    .setDescription(next)
                    .setColor(getUserColor(userId))],
                ephemeral: true,
            });
        });

        collector.on('end', async () => {
            try {
                await reply.edit({ components: [] });
            } catch {
                // Message deleted.
            }
        });
    },
};

export default command;
