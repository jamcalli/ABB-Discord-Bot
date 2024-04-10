import fs from 'fs';
import path from 'path';
import { Client, Collection } from "discord.js";
import { initializeLogger } from './utils/logger.ts';
import { config } from "./config.ts";
import { deployCommands } from "./deploy-commands.ts";
import { qbittorrent, downloadHandler } from "./utils/qbittorrent.ts";

// Initialize logger
export const logger = initializeLogger();
logger.info("Logger has been initialized.");

const isDevelopment = process.env.NODE_ENV === 'development';
const fileExtension = isDevelopment ? '.ts' : '.js';
const baseDir = isDevelopment ? 'src' : 'dist/src';

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
const foldersPath = path.join(process.cwd(), baseDir, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(fileExtension));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        import(filePath).then(command => {
            // Set a new item in the Collection with the key as the command name and the value as the exported module
            if ('data' in command && 'execute' in command) {
                client.commands.set(command.data.name, command);
            } else {
                logger.error(`The command at ${filePath} is missing a required "data" or "execute" property.`);
            }
        }).catch(error => {
            if (error instanceof Error) {
                logger.error(`Failed to load command at ${filePath}: ${error.message}`);
            }
        });
    }
}

// Read event files from the 'events' directory
const eventsPath = path.join(process.cwd(), baseDir, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith(fileExtension));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    import(filePath).then(event => {
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args));
        } else {
            client.on(event.name, (...args) => event.execute(...args));
        }
    }).catch(error => {
        if (error instanceof Error) {
            logger.error(`Failed to load event at ${filePath}: ${error.message}`);
        }
    });
}

// Log in to the Discord client and deploy commands
client.login(config.DISCORD_TOKEN).catch(error => {
    if (error instanceof Error) {
        logger.error(`Failed to login to Discord: ${error.message}`);
    }
});
deployCommands().catch(error => {
    if (error instanceof Error) {
        logger.error(`Failed to deploy commands: ${error.message}`);
    }
});