import { Message, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ButtonInteraction } from 'discord.js';
import { Command } from '../../handlers/commandHandler';
import { getUserColor } from '../../database/userColor';

/**
 * Tebex checkout configuration.
 *
 * TEBEX_STORE_URL is the store root, e.g. https://goldbot.tebex.io
 * TEBEX_PACKAGE_<amount> optionally maps a credit bundle to a package id, e.g.
 *   TEBEX_PACKAGE_5=1234567
 * When a package id is present the button links straight to that package,
 * otherwise it links to the store root and asks the buyer to pick the bundle.
 * With no store configured at all the command falls back to a support ticket
 * rather than handing out a link that goes nowhere.
 */
const TEBEX_STORE_URL = (process.env.TEBEX_STORE_URL || '').replace(/\/+$/, '') || null;
const SUPPORT_INVITE = 'https://discord.gg/vCnqckmmW6';
const SITE_URL = (process.env.SITE_URL || '').replace(/\/+$/, '') || null;

/** Purchasable credit bundles, in whole USD. */
const AMOUNTS = [5, 10, 25, 50, 100];

function packageId(amount: number): string | null {
    return process.env[`TEBEX_PACKAGE_${amount}`] || null;
}

function checkoutUrl(amount: number): string | null {
    if (!TEBEX_STORE_URL) return null;
    const pkg = packageId(amount);
    return pkg ? `${TEBEX_STORE_URL}/package/${pkg}` : TEBEX_STORE_URL;
}

/** Links to the policy pages when a site is configured, plain text otherwise. */
function policyLine(): string {
    const tos = SITE_URL ? `[Terms of Service](${SITE_URL}/terms)` : 'Terms of Service';
    const purchase = SITE_URL ? `[Purchase Policies](${SITE_URL}/purchase-policy)` : 'Purchase Policies';
    return `⚠️ By purchasing anything on our store you agree to GoldBot's ${tos} and ${purchase}. ` +
        `If you're experiencing issues join GoldBot's [Support Server](${SUPPORT_INVITE}) (\`~support\`) ` +
        `and contact support via the support channel.`;
}

const command: Command = {
    name: 'donate',
    description: 'Purchase Credit',
    usage: '~donate',
    execute: async (message: Message, args: string[], client: Client) => {
        const userId = message.author.id;

        const embed = new EmbedBuilder()
            .setTitle('Purchasing 💎 GoldBot Credit')
            .setDescription(
                '1. Select an amount you wish to purchase by clicking one of the buttons below\n' +
                '📄 - Each 💎 **GoldBot Credit** is equal to **$1.00 USD**\n' +
                '2. Once selected, a new private message will appear with your checkout link.\n' +
                'Open it up and pay for your cart.\n' +
                '3. Once your purchase has been processed, it will automatically be added to your\n' +
                '`~dcred`. Enjoy!\n\n' +
                policyLine()
            )
            .setColor(getUserColor(userId));

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            ...AMOUNTS.map(a => new ButtonBuilder()
                .setCustomId(`donate_${a}`)
                .setLabel(String(a))
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('💎'))
        );

        // Buttons are served by the global InteractionCreate handler rather
        // than a per-message collector. A collector expires, and an expired
        // purchase prompt still looks clickable while failing with "the
        // application didn't respond in time" — which is exactly what a buyer
        // should never see. A global handler also survives bot restarts.
        await message.reply({ embeds: [embed], components: [row] });
    },
};

/** True when this interaction belongs to the donate flow. */
export function isDonateButton(customId: string): boolean {
    return /^donate_\d+$/.test(customId);
}

/**
 * Handles a donate button press. Anyone may press their own prompt's buttons;
 * the reply is ephemeral so no one else sees the checkout link either way.
 */
export async function handleDonateButton(interaction: ButtonInteraction): Promise<void> {
    const amount = Number(interaction.customId.replace('donate_', ''));
    if (!AMOUNTS.includes(amount)) return;

    const userId = interaction.user.id;
    const url = checkoutUrl(amount);
    const body = url
        ? `Your cart is ready. [Open your checkout link](${url}) and pay for your cart.\n\n` +
          (packageId(amount) ? '' : '_Select the matching bundle on the store page._\n\n') +
          `Once processed, 💎 **${amount}** will be added to your \`~dcred\` automatically.`
        : `Open a ticket in the [Support Server](${SUPPORT_INVITE}) and tell staff you want ` +
          `💎 **${amount} Credit**. They will send you a payment link and apply it to your \`~dcred\`.`;

    const dm = new EmbedBuilder()
        .setTitle(`💎 ${amount} GoldBot Credit — $${amount}.00 USD`)
        .setDescription(body)
        .setColor(getUserColor(userId));

    // Acknowledge within Discord's 3 second window before attempting the DM,
    // which is a network call that can easily outlast it.
    await interaction.deferReply({ ephemeral: true });

    try {
        await interaction.user.send({ embeds: [dm] });
        await interaction.editReply({ content: '📬 Check your private messages for your checkout link!' });
    } catch {
        await interaction.editReply({
            content: "I couldn't DM you — your privacy settings may block messages from this server.",
            embeds: [dm],
        });
    }
}

export default command;
