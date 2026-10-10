const { EmbedBuilder } = require('discord.js');
const { getSettings } = require('../database/db');
const config = require('../config');
const logger = require('../utils/logger');

module.exports = async function guildMemberAdd(client, member) {
  try {
    const settings = getSettings(member.guild.id);
    if (settings.log_channel_id) {
      const channel = member.guild.channels.cache.get(settings.log_channel_id) || await member.guild.channels.fetch(settings.log_channel_id).catch(() => null);
      if (channel) {
        const embed = new EmbedBuilder()
          .setColor('#2B2D31')
          .setTitle('Nuovo membro')
          .setDescription(`<@${member.user.id}> si è unito al server.`)
          .addFields({ name: 'Creato', value: member.user.createdAt.toISOString() || 'N/D', inline: true })
          .setTimestamp();
        await channel.send({ embeds: [embed] }).catch(() => null);
      }
    }

    const joinWindow = Date.now() - config.ANTI_RAID.warningWindowMs;
    const recentJoins = member.guild.members.cache.filter((m) => m.joinedTimestamp && m.joinedTimestamp > joinWindow).size;
    if (recentJoins >= config.ANTI_RAID.joinThreshold) {
      logger.warn(`Anti-Raid trigger per ${member.guild.name}: joins anomali.`);
    }
  } catch (error) {
    logger.error('guildMemberAdd error', error);
  }
};
