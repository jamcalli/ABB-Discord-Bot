import { Client } from "discord.js";
import { initializeLogger } from './utils/logger';
import { config } from "./config";
import { deployCommands } from "./deploy-commands";
import { commands } from "./commands";
import {  qbittorrent, downloadHandler } from "./utils/qbittorrent";

export const logger = initializeLogger();
logger.info("Logger has been initialized.");

export const client = new Client({
  intents: ["Guilds", "GuildMessages", "DirectMessages"],
});

client.once("ready", () => {
  logger.info("Discord bot is ready! 🤖"); // Use winston for logging
  downloadHandler(qbittorrent);
  logger.info("Download handler is running..."); // Log that the download handler is running
});

client.on("guildCreate", async (guild) => {
  await deployCommands({ guildId: guild.id });
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) {
    return;
  }
  const { commandName } = interaction;
  if (commands[commandName as keyof typeof commands]) {
    commands[commandName as keyof typeof commands].execute(interaction);
  }
});

client.login(config.DISCORD_TOKEN);