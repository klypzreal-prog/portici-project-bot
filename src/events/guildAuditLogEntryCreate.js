const { EmbedBuilder } = require('discord.js');
const { getSettings } = require('../database/db');
const config = require('../config');
const logger = require('../utils/logger');

module.exports = async function messageCreate(client, message) {
  if (message.author.bot || !message.guild) return;

  try {
    const mentionCount = message.mentions.users.size + message.mentions.roles.size;
    const linkCount = (message.content.match(/https?:\/\//gi) || []).length;

    if (mentionCount >= config.ANTI_RAID.maxMentions || linkCount >= config.ANTI_RAID.maxLinks) {
      const settings = getSettings(message.guild.id);
      if (settings.log_channel_id) {
        const logChannel = message.guild.channels.cache.get(settings.log_channel_id) || await message.guild.channels.fetch(settings.log_channel_id).catch(() => null);
        if (logChannel) {
          const embed = new EmbedBuilder()
            .setColor('#2B2D31')
            .setTitle('Anti-Raid / Spam rilevato')
            .setDescription(`Messaggio potenzialmente sospetto da <@${message.author.id}>.`)
            .addFields(
              { name: 'Menzioni', value: String(mentionCount), inline: true },
              { name: 'Link', value: String(linkCount), inline: true }
            )
            .setTimestamp();
          await logChannel.send({ embeds: [embed] }).catch(() => null);
        }
      }
    }
  } catch (error) {
    logger.error('messageCreate error', error);
  }
};
