import fs from 'fs';
import path from 'path';
import { Client, Collection } from "discord.js";
import { initializeLogger } from './utils/logger';
import { config } from "./config";
import { deployCommands } from "./deploy-commands";
import {  qbittorrent, downloadHandler } from "./utils/qbittorrent";

export const logger = initializeLogger();
logger.info("Logger has been initialized.");

export const client = new Client({intents: ["Guilds", "GuildMessages", "DirectMessages"],});

client.once("ready", () => {
	downloadHandler(client, qbittorrent);
	logger.info("Download handler is running..."); // Log that the download handler is running
	logger.info("Discord bot is ready! 🤖"); // Use winston for logging

});

client.commands = new Collection();

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
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

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

client.login(config.DISCORD_TOKEN);
deployCommands();