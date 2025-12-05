
import { REST, Routes } from 'discord.js';
import { loadCommands } from './handlers/commandHandler';
import dotenv from 'dotenv';
import { Client, GatewayIntentBits } from 'discord.js';

dotenv.config();

const main = async () => {
    const token = process.env.BOT_TOKEN;
    const clientId = process.env.CLIENT_ID;
    const guildId = process.env.GUILD_ID;

    if (!token || !clientId || !guildId) {
        console.error('Missing env vars');
        return;
    }

    const client = new Client({ intents: [] });
    // @ts-ignore
    const commandsMap = loadCommands(client);
    const commands: any[] = [];

    commandsMap.forEach((cmd) => {
        if (cmd.data) {
            commands.push(cmd.data.toJSON());
        }
    });

    const rest = new REST({ version: '10' }).setToken(token);

    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        const data = await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commands },
        );

        console.log(`Successfully reloaded application (/) commands.`);
    } catch (error) {
        console.error(error);
    }
};

main();
