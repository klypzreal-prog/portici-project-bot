const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const { commands } = require('../commands/commands');

function commandHandler(client) {
  for (const command of commands) {
    client.commands.set(command.data.name, command);
  }

  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction, client);
    } catch (error) {
      logger.error(`Errore comando ${interaction.commandName}`, error);

      const payload = {
        content: 'Si è verificato un errore durante l\'esecuzione del comando.',
        ephemeral: true
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(payload).catch(() => null);
      } else {
        await interaction.reply(payload).catch(() => null);
      }
    }
  });
}

module.exports = { commandHandler };
