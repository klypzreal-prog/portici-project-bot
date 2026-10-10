const { EmbedBuilder } = require('discord.js');
const { getSettings } = require('../database/db');
const logger = require('../utils/logger');

module.exports = async function channelUpdate(client, oldChannel, newChannel) {
  if (!newChannel.guild) return;

  try {
    const settings = getSettings(newChannel.guild.id);
    if (settings.log_channel_id) {
      const logChannel = newChannel.guild.channels.cache.get(settings.log_channel_id) || await newChannel.guild.channels.fetch(settings.log_channel_id).catch(() => null);
      if (logChannel) {
        const embed = new EmbedBuilder().setColor('#2B2D31').setTitle('Canale aggiornato').setDescription(`Canale aggiornato: <#${newChannel.id}>`).setTimestamp();
        await logChannel.send({ embeds: [embed] }).catch(() => null);
      }
    }
  } catch (error) {
    logger.error('channelUpdate error', error);
  }
};
