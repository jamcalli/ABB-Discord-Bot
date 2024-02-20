import { REST, Routes } from 'discord.js';
import { config } from "./config";
import fs from 'fs';
import path from 'path';

interface Command {
  data: {
    toJSON: Function;
  };
  execute: Function;
}

export async function deployCommands() {
  const commands: Command[] = [];
  const foldersPath = path.join(__dirname, 'commands');
  const commandFolders = fs.readdirSync(foldersPath);

  for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts'));
    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      const command: Command = require(filePath);
      if ('data' in command && 'execute' in command) {
        console.log(`Pushing new commands!`);
        commands.push(command.data.toJSON());
      } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
      }
    }
  }

  const rest = new REST().setToken(config.DISCORD_TOKEN);

  try {
    console.log(`Started refreshing ${commands.length} application (/) commands.`);
    const data: any = await rest.put(
      Routes.applicationGuildCommands(config.DISCORD_CLIENT_ID, config.DISCORD_GUILD_ID),
      { body: commands },
    );
    console.log(`Successfully reloaded ${data.length} application (/) commands.`);
  } catch (error) {
    console.error(error);
  }
}