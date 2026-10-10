const { EmbedBuilder } = require('discord.js');
const { getSettings } = require('../database/db');
const logger = require('../utils/logger');

module.exports = async function roleDelete(client, role) {
  try {
    const settings = getSettings(role.guild.id);
    if (settings.log_channel_id) {
      const logChannel = role.guild.channels.cache.get(settings.log_channel_id) || await role.guild.channels.fetch(settings.log_channel_id).catch(() => null);
      if (logChannel) {
        const embed = new EmbedBuilder().setColor('#2B2D31').setTitle('Ruolo eliminato').setDescription(`Ruolo eliminato: **${role.name}**`).setTimestamp();
        await logChannel.send({ embeds: [embed] }).catch(() => null);
      }
    }
  } catch (error) {
    logger.error('roleDelete error', error);
  }
};
