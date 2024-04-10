import { REST, Routes } from 'discord.js';
import { config } from "./config.ts";
import fs from 'fs';
import path from 'path';
import { logger } from './bot.ts'; 
import { Command } from './interface/deploy-commands.interface';

const isDevelopment = process.env.NODE_ENV === 'development';
// Define the env
const fileExtension = isDevelopment ? '.ts' : '.js';
const baseDir = isDevelopment ? 'src' : 'dist/src';

export async function deployCommands() {
  const commands: Command[] = [];
  const foldersPath = path.join(process.cwd(), baseDir, 'commands');
  const commandFolders = fs.readdirSync(foldersPath);

  // Collect all the Promises returned by import()
  const importPromises: Promise<void>[] = [];

  // Iterate over each command folder
  for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(fileExtension));
    // Iterate over each command file
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        importPromises.push(
          new Promise((resolve, reject) => {
            import(filePath).then((commandModule) => {
                const command: Command = commandModule.default || commandModule;

                // Check if the command has the required properties
                if ('data' in command && 'execute' in command) {
                    logger.info(`Pushing new commands!`);
                    commands.push(command.data.toJSON());
                } else {
                    logger.warn(`The command at ${filePath} is missing a required "data" or "execute" property.`);
                }
                resolve();
            }).catch(error => {
                if (error instanceof Error) {
                    logger.error(`Failed to load command at ${filePath}: ${error.message}`);
                }
                reject(error);
            });
          })
        );
    }
  }

  // Wait for all command modules to be loaded
  await Promise.all(importPromises);

  const rest = new REST().setToken(config.DISCORD_TOKEN);

  try {
    logger.info(`Started refreshing ${commands.length} application (/) commands.`);
    const data: any = await rest.put(
      Routes.applicationGuildCommands(config.DISCORD_CLIENT_ID, config.DISCORD_GUILD_ID),
      { body: commands },
    );
    logger.info(`Successfully reloaded ${data.length} application (/) commands.`);
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Failed to reload application (/) commands: ${error.message}`);
    }
  }
}