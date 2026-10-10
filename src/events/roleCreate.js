const { EmbedBuilder } = require('discord.js');
const { getSettings } = require('../database/db');
const logger = require('../utils/logger');

module.exports = async function channelDelete(client, channel) {
  if (!channel.guild) return;

  try {
    const settings = getSettings(channel.guild.id);
    if (settings.log_channel_id) {
      const logChannel = channel.guild.channels.cache.get(settings.log_channel_id) || await channel.guild.channels.fetch(settings.log_channel_id).catch(() => null);
      if (logChannel) {
        const embed = new EmbedBuilder().setColor('#2B2D31').setTitle('Canale eliminato').setDescription(`Canale eliminato: **${channel.name || 'Sconosciuto'}**`).setTimestamp();
        await logChannel.send({ embeds: [embed] }).catch(() => null);
      }
    }
  } catch (error) {
    logger.error('channelDelete error', error);
  }
};
