const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

function eventHandler(client) {
  const eventsDir = path.join(__dirname, '..', 'events');
  const eventFiles = fs.readdirSync(eventsDir).filter((file) => file.endsWith('.js'));

  for (const file of eventFiles) {
    const eventModule = require(path.join(eventsDir, file));
    const eventName = file.replace(/\.js$/, '');

    if (typeof eventModule === 'function') {
      client.on(eventName, eventModule.bind(null, client));
    } else if (eventModule && typeof eventModule.execute === 'function') {
      client.on(eventModule.name || eventName, eventModule.execute.bind(null, client));
    }
  }

  logger.info(`Caricati ${eventFiles.length} eventi.`);
}

module.exports = { eventHandler };
