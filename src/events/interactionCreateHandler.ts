import { Events, CommandInteraction } from "discord.js";
import { logger } from '../bot';

// The name of the event
const name = Events.InteractionCreate;

// The function to execute when the event is triggered
async function execute(interaction: CommandInteraction) {
    // If the interaction is not a chat input command, return
    if (!interaction.isChatInputCommand()) return;

    // Get the command from the client's commands
    const command = interaction.client.commands.get(interaction.commandName);

    // If the command does not exist, log an error and return
    if (!command) {
        logger.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        // Try to execute the command
        await command.execute(interaction);
    } catch (error) {
        // If an error occurs, log the error
        logger.error(error);
        // If the interaction has already been replied to or deferred
        if (interaction.replied || interaction.deferred) {
            // Follow up with an error message
            await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
        } else {
            // Otherwise, reply with an error message
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }
}

// Export the name and execute function
export  { name, execute };