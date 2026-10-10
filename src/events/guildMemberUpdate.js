const { EmbedBuilder } = require('discord.js');
const { getSettings } = require('../database/db');
const logger = require('../utils/logger');

module.exports = async function guildAuditLogEntryCreate(client, guild, entry) {
  try {
    const settings = getSettings(guild.id);
    const logChannel = guild.channels.cache.get(settings.log_channel_id) || await guild.channels.fetch(settings.log_channel_id).catch(() => null);

    if (!logChannel) return;

    const suspicious = [
      'MemberKick',
      'MemberBanAdd',
      'RoleCreate',
      'RoleDelete',
      'ChannelCreate',
      'ChannelDelete',
      'OverwriteCreate',
      'OverwriteUpdate',
      'OverwriteDelete'
    ];

    if (suspicious.includes(entry.action)) {
      const embed = new EmbedBuilder()
        .setColor('#2B2D31')
        .setTitle('Audit Log rilevato')
        .setDescription(`Azione sospetta: **${entry.action}**\nUtente: <@${entry.executor?.id || 'Sconosciuto'}>\nTarget: ${entry.target ? `**${entry.target.id || entry.target.name || 'Sconosciuto'}**` : 'N/D'}`)
        .addFields({ name: 'Reason', value: entry.reason || 'Nessun motivo registrato', inline: false })
        .setTimestamp();
      await logChannel.send({ embeds: [embed] }).catch(() => null);
    }
  } catch (error) {
    logger.error('guildAuditLogEntryCreate error', error);
  }
};
