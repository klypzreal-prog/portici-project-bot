const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const dotenv = require('dotenv');
const path = require('path');
const { initDatabase } = require('./database/db');
const { commandHandler } = require('./handlers/commandHandler');
const { eventHandler } = require('./handlers/eventHandler');
const logger = require('./utils/logger');
const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID, NODE_ENV } = require('./config');

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildIntegrations,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessageReactions
  ],
  partials: [Partials.Channel, Partials.GuildMember, Partials.Message, Partials.User, Partials.Reaction],
  allowedMentions: { parse: ['users', 'roles'], repliedUser: false }
});

client.commands = new Collection();
client.cooldowns = new Collection();
client.config = {
  clientId: CLIENT_ID,
  guildId: GUILD_ID,
  nodeEnv: NODE_ENV
};

client.once('ready', async () => {
  logger.info(`Bot online: ${client.user.tag} (${client.user.id})`);
  try {
    await initDatabase();
    logger.info('Database inizializzato correttamente.');
  } catch (error) {
    logger.error('Errore inizializzazione database', error);
  }
});

client.on('error', (error) => logger.error('Client error', error));
client.on('warn', (warning) => logger.warn(warning));

commandHandler(client);
eventHandler(client);

client.login(DISCORD_TOKEN).catch((error) => {
  logger.error('Fallimento login Discord', error);
  process.exit(1);
});
