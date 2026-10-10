const { EmbedBuilder } = require('discord.js');
const { getSettings } = require('../database/db');
const logger = require('../utils/logger');

module.exports = async function guildMemberRemove(client, member) {
  try {
    const settings = getSettings(member.guild.id);
    if (settings.log_channel_id) {
      const channel = member.guild.channels.cache.get(settings.log_channel_id) || await member.guild.channels.fetch(settings.log_channel_id).catch(() => null);
      if (channel) {
        const embed = new EmbedBuilder()
          .setColor('#2B2D31')
          .setTitle('Membro uscito')
          .setDescription(`<@${member.user.id}> ha lasciato il server.`)
          .setTimestamp();
        await channel.send({ embeds: [embed] }).catch(() => null);
      }
    }
  } catch (error) {
    logger.error('guildMemberRemove error', error);
  }
};
