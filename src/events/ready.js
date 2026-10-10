const { REST, Routes } = require('discord.js');
const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = require('./config');
const { commands } = require('./commands/commands');

if (!DISCORD_TOKEN || !CLIENT_ID) {
  console.error('DISCORD_TOKEN e CLIENT_ID sono obbligatori.');
  process.exit(1);
}

const commandData = commands.map((command) => command.data.toJSON());
const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

(async () => {
  try {
    if (GUILD_ID) {
      await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commandData });
      console.log('Comandi slash registrati nel server specificato.');
    } else {
      await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commandData });
      console.log('Comandi slash registrati globalmente.');
    }
  } catch (error) {
    console.error('Errore di registrazione comandi', error);
    process.exit(1);
  }
})();
