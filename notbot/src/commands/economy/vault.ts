import { resolveTargetOrSelf } from '../../utils/resolveTarget';

const command: Command = {
    name: 'vault',
    description: 'View your currency vault',
    execute: async (message: Message, args: string[], client: Client) => {
        const target = await resolveTargetOrSelf(message, args, client);
        const user = await getUser(target.id);

        // Handle help argument
        if (args[0]?.toLowerCase() === 'help') {
            const helpEmbed = new EmbedBuilder()
                .setTitle('Vault Help')
                .setDescription("Here's some information regarding the currencies that are currently guarded against attackers")
                .setColor(getUserColor(message.author.id))
                .addFields(
                    {
                        name: '🍥 Credits',
                        value: 'Each 🍥 is worth 💵 50,000\n`~deposit <amount>` to deposit your 💵 into 🍥\n`~withdraw <amount>` to withdraw your 🍥 converting into 💵',
                        inline: false
                    },
                    {
                        name: '💎 Gems',
                        value: 'Earned from plunging into the depths of the Mines via `~mine`, and can be used to purchase 💊 **Miner\'s Capsules** from the `~pub`, or other misc items/perks',
                        inline: false
                    }
                );

            message.reply({ embeds: [helpEmbed] });
            return;
        }

        const credits = BigInt(user.credits || 0);
        const maxCredits = 20n;
        const creditValue = credits * 50000n;

        const embed = new EmbedBuilder()
            .setTitle(`${target.username} (@${target.tag})'s Currency Vault`)
            .setDescription('Currencies in your vault cannot be attacked or stolen by other players.\n`~vault help` for more information')
            .setColor(getUserColor(message.author.id))
            .addFields(
                { name: 'Gems Vault', value: `💎 0.0`, inline: false },
                {
                    name: `Credits Vault [${maxCredits}]`,
                    value: `Credits | 🍥 ${formatBigNumber(credits)} / 🍥 ${formatBigNumber(maxCredits)}\nTotal Value | 💵 ${formatBigNumber(creditValue)}`,
                    inline: false
                }
            );

        message.reply({ embeds: [embed] });
    },
};

export default command;
