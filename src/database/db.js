const dotenv = require('dotenv');

dotenv.config();

const config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  DISCORD_TOKEN: process.env.DISCORD_TOKEN,
  CLIENT_ID: process.env.CLIENT_ID,
  GUILD_ID: process.env.GUILD_ID,
  LOG_CHANNEL_ID: process.env.LOG_CHANNEL_ID,
  TICKET_CATEGORY_ID: process.env.TICKET_CATEGORY_ID,
  BOOST_CHANNEL_ID: process.env.BOOST_CHANNEL_ID,
  BOOST_ROLE_ID: process.env.BOOST_ROLE_ID,
  MODERATION_ROLE_ID: process.env.MODERATION_ROLE_ID,
  ADMIN_ROLE_ID: process.env.ADMIN_ROLE_ID,
  DATABASE_PATH: process.env.DATABASE_PATH || './data/portici-bot.db',
  ANTI_NUKE: {
    channelThreshold: 4,
    roleThreshold: 4,
    banThreshold: 3,
    kickThreshold: 3,
    permissionThreshold: 2,
    windowMs: 30000
  },
  ANTI_RAID: {
    joinThreshold: 5,
    warningWindowMs: 15000,
    cooldownMs: 120000,
    maxMentions: 4,
    maxLinks: 3
  }
};

module.exports = config;
