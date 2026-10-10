const { EmbedBuilder } = require('discord.js');
const { getSettings } = require('../database/db');
const logger = require('../utils/logger');

module.exports = async function roleUpdate(client, oldRole, newRole) {
  try {
    const settings = getSettings(newRole.guild.id);
    if (settings.log_channel_id) {
      const logChannel = newRole.guild.channels.cache.get(settings.log_channel_id) || await newRole.guild.channels.fetch(settings.log_channel_id).catch(() => null);
      if (logChannel) {
        const embed = new EmbedBuilder().setColor('#2B2D31').setTitle('Ruolo aggiornato').setDescription(`Ruolo modificato: **${newRole.name}**`).setTimestamp();
        await logChannel.send({ embeds: [embed] }).catch(() => null);
      }
    }
  } catch (error) {
    logger.error('roleUpdate error', error);
  }
};
