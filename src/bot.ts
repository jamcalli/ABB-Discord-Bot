import fs from 'fs';
import path from 'path';
import { Client, Collection } from "discord.js";
import { initializeLogger } from './utils/logger';
import { config } from "./config";
import { deployCommands } from "./deploy-commands";
import {  qbittorrent, downloadHandler } from "./utils/qbittorrent";

// Initialize logger
export const logger = initializeLogger();
logger.info("Logger has been initialized.");

// Initialize Discord client
export const client = new Client({intents: ["Guilds", "GuildMessages", "DirectMessages"],});

// Once the client is ready, start the download handler and log the status
client.once("ready", () => {
    downloadHandler(client, qbittorrent);
    logger.info("Download handler is running...");
    logger.info("Discord bot is ready! 🤖");
});

// Initialize commands collection
client.commands = new Collection();

// Read command files from the 'commands' directory
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        // Set a new item in the Collection with the key as the command name and the value as the exported module
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        } else {
            logger.error(`The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}

// Read event files from the 'events' directory
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.ts'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

// Log in to the Discord client and deploy commands
client.login(config.DISCORD_TOKEN);
deployCommands();