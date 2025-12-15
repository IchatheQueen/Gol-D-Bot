import { Message, Client, EmbedBuilder } from 'discord.js';
import { Command } from '../../handlers/commandHandler';
import { resolveTarget } from '../../utils/resolveTarget';

const command: Command = {
    name: 'enslave',
    description: 'Abduct and enslave a user (Troll Command)',
    execute: async (message: Message, args: string[], client: Client) => {
        const targetUser = await resolveTarget(message, args, client);

        if (!targetUser) {
            message.reply('Usage: `~enslave <user>`');
            return;
        }

        if (targetUser.id === message.author.id) {
            message.reply('You cannot enslave yourself... weirdo.');
            return;
        }

        const attackerTag = `${message.author.username} (@${message.author.username})`;
        // Note: Screenshot shows specific formatting like "<🌕GILDED⚔️@user>". 
        // I will stick to standard username for now as I don't have their custom formatting function.
        // Or I can just use message.author.username.

        const targetTag = `@${targetUser.username}`;

        // Helper for delays
        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        // 1. Abduction
        const msg1 = new EmbedBuilder()
            .setDescription(`${message.author} has abducted you from your home and shackled you, you're now a slave`)
            .setColor('#2F3136');
        await message.channel.send({ embeds: [msg1] });
        await delay(2000);

        // 2. Chaining & Whip (Money Drop)
        // Fake money: 144 digits? Just a huge random number.
        const fakeMoney = '325,110,750,711,753,545,216... (144 digits)';
        const msg2 = new EmbedBuilder()
            .setDescription(`${message.author} has chained you facing a tree and whipped out their 🪢 , ${message.author} cracks the whip on your whip and 💵 ${fakeMoney} has fallen out`)
            .setColor('#2F3136');
        await message.channel.send({ embeds: [msg2] });
        await delay(2000);

        // 3. Whip Legs (Weed Drop)
        const msg3 = new EmbedBuilder()
            .setDescription(`${message.author} swings their whip again and snaps it on the back of your legs, causing 🌿 0 to fall out`)
            .setColor('#2F3136');
        await message.channel.send({ embeds: [msg3] });
        await delay(2000);

        // 4. Cat Jump
        const msg4 = new EmbedBuilder()
            .setDescription(`${message.author} swings their whip a final time but your cat jumps in the way, your cat loses 🌸 1000`)
            .setColor('#2F3136');
        await message.channel.send({ embeds: [msg4] });
        await delay(2000);

        // 5. Noose
        const msg5 = new EmbedBuilder()
            .setDescription(`${message.author} grabs a noose and begins to hang their slave ${targetTag}`)
            .setColor('#2F3136');
        await message.channel.send({ embeds: [msg5] });
        await delay(2000);

        // 6. Hanging Struggles (Item drops)
        const struggles = [
            { emoji: '💊', amount: 814 },
            { emoji: '🍺', amount: 81 },
            { emoji: '📜', amount: 0 }
        ];

        for (const item of struggles) {
            const struggleEmbed = new EmbedBuilder()
                .setDescription(`${targetTag} struggles while being hanged and loses ${item.emoji} ${item.amount}`)
                .setColor('#2F3136');
            await message.channel.send({ embeds: [struggleEmbed] });
            await delay(1500);
        }

        await delay(1000);

        // 7. Final Troll Message
        const finalEmbed = new EmbedBuilder()
            .setDescription(`Im just playing w/ you boy, you lost nothing`)
            .setColor('#2F3136');
        await message.channel.send({ embeds: [finalEmbed] });
    }
};

export default command;
