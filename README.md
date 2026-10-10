const { EmbedBuilder } = require('discord.js');
const { getSettings, addBoostEvent, hasBoostEvent } = require('../database/db');
const logger = require('../utils/logger');

module.exports = async function guildMemberUpdate(client, oldMember, newMember) {
  try {
    const settings = getSettings(newMember.guild.id);
    const boostChannel = settings.boost_channel_id ? newMember.guild.channels.cache.get(settings.boost_channel_id) || await newMember.guild.channels.fetch(settings.boost_channel_id).catch(() => null) : null;
    if (!boostChannel) return;

    const hadRole = oldMember.roles.cache.has(settings.boost_role_id || '');
    const hasRole = newMember.roles.cache.has(settings.boost_role_id || '');

    if (!hadRole && hasRole && !hasBoostEvent(newMember.guild.id, newMember.user.id)) {
      addBoostEvent(newMember.guild.id, newMember.user.id);

      const embed = new EmbedBuilder()
        .setColor('#2B2D31')
        .setTitle('Server Boost rilevato')
        .setDescription(`<@${newMember.user.id}> ha effettuato un boost al server!`)
        .setTimestamp();

      await boostChannel.send({ embeds: [embed] }).catch(() => null);
    }
  } catch (error) {
    logger.error('guildMemberUpdate error', error);
  }
};
