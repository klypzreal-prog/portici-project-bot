const logger = require('../utils/logger');

module.exports = function ready(client) {
  logger.info(`Evento ready attivato. Bot: ${client.user.tag}`);
};
