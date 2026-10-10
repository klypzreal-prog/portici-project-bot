const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const { getSettings, addWarning, getWarnings, addModerationLog, getModerationLogs, addTicket, closeTicket, getTicketByChannel } = require('../database/db');
const logger = require('../utils/logger');

const ticketTypes = {
  moderation: 'Ticket Moderazione',
  refunds: 'Ticket Rimborsi',
  applications: 'Ticket Candidature',
  other: 'Ticket Altro',
  development: 'Ticket Sviluppo',
  donations: 'Ticket Donazioni'
};

async function createTicket(interaction, typeKey, typeLabel) {
  const guild = interaction.guild;
  const settings = getSettings(guild.id);
  const categoryId = settings.ticket_category_id || interaction.guild.channels.cache.find((ch) => ch.type === ChannelType.GuildCategory)?.id;

  if (!categoryId) {
    return interaction.reply({ content: 'Nessuna categoria ticket configurata. Configura `TICKET_CATEGORY_ID` nel file `.env` o nel server.', ephemeral: true });
  }

  const channel = await guild.channels.create({
    name: `${typeKey}-${interaction.user.username}`.slice(0, 80),
    type: ChannelType.GuildText,
    parent: categoryId,
    permissionOverwrites: [
      { id: guild.roles.everyone, deny: ['ViewChannel'] },
      { id: interaction.user.id, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] },
      { id: settings.moderation_role_id || guild.roles.everyone, allow: ['ViewChannel', 'ManageMessages', 'ManageChannels', 'ReadMessageHistory'] }
    ]
  });

  addTicket({ guildId: guild.id, channelId: channel.id, ownerId: interaction.user.id, type: typeLabel });

  const embed = new EmbedBuilder()
    .setColor('#2B2D31')
    .setTitle(`${typeLabel}`)
    .setDescription(`Benvenuto/a <@${interaction.user.id}>. Il tuo ticket è stato creato. Un moderatore ti risponderà a breve.`)
    .addFields(
      { name: 'Stato', value: 'Aperto', inline: true },
      { name: 'Tipo', value: typeLabel, inline: true }
    )
    .setTimestamp();

  await channel.send({ embeds: [embed] });
  await interaction.reply({ content: `Ticket creato: <#${channel.id}>`, ephemeral: true });
}

const commands = [
  {
    data: new SlashCommandBuilder()
      .setName('ticket')
      .setDescription('Crea un ticket per il supporto del server')
      .addStringOption((option) => option.setName('tipo').setDescription('Seleziona il tipo di ticket').setRequired(true).addChoices(
        { name: 'Ticket Moderazione', value: 'moderation' },
        { name: 'Ticket Rimborsi', value: 'refunds' },
        { name: 'Ticket Candidature', value: 'applications' },
        { name: 'Ticket Altro', value: 'other' },
        { name: 'Ticket Sviluppo', value: 'development' },
        { name: 'Ticket Donazioni', value: 'donations' }
      )),
    async execute(interaction) {
      const typeKey = interaction.options.getString('tipo');
      const typeLabel = ticketTypes[typeKey];
      await createTicket(interaction, typeKey, typeLabel);
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('close')
      .setDescription('Chiude un ticket aperto')
      .addStringOption((option) => option.setName('motivo').setDescription('Motivo della chiusura').setRequired(false)),
    async execute(interaction) {
      const ticket = getTicketByChannel(interaction.channelId);
      const reason = interaction.options.getString('motivo') || 'Chiusura manuale';

      if (!ticket) {
        return interaction.reply({ content: 'Questo canale non è un ticket valido.', ephemeral: true });
      }

      if (interaction.channel) {
        await interaction.channel.send({ content: `Ticket chiuso da <@${interaction.user.id}>. Motivo: ${reason}` });
      }

      closeTicket(interaction.channelId);
      addModerationLog({
        guildId: interaction.guild.id,
        type: 'ticket_close',
        moderatorId: interaction.user.id,
        targetId: ticket.owner_id,
        reason
      });
      await interaction.reply({ content: 'Ticket chiuso.', ephemeral: true });
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('ban')
      .setDescription('Banna un membro dal server')
      .addUserOption((option) => option.setName('utente').setRequired(true).setDescription('Utente da bannare'))
      .addStringOption((option) => option.setName('motivo').setDescription('Motivo del ban').setRequired(false)),
    async execute(interaction) {
      if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
        return interaction.reply({ content: 'Non hai i permessi per eseguire questo comando.', ephemeral: true });
      }

      const target = interaction.options.getUser('utente');
      const reason = interaction.options.getString('motivo') || 'Nessun motivo specificato';

      await interaction.guild.members.ban(target, { reason });
      addModerationLog({guildId: interaction.guild.id, type: 'ban', moderatorId: interaction.user.id, targetId: target.id, reason});
      await interaction.reply({ content: `Utente <@${target.id}> bannato. Motivo: ${reason}` });
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('unban')
      .setDescription('Revoca il ban a un utente')
      .addStringOption((option) => option.setName('userid').setDescription('ID dell\'utente da sbannare').setRequired(true)),
    async execute(interaction) {
      if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
        return interaction.reply({ content: 'Non hai i permessi per eseguire questo comando.', ephemeral: true });
      }

      const userId = interaction.options.getString('userid');
      await interaction.guild.members.unban(userId, 'Revoca ban tramite comando slash');
      addModerationLog({guildId: interaction.guild.id, type: 'unban', moderatorId: interaction.user.id, targetId: userId, reason: 'Revoca ban'});
      await interaction.reply({ content: `L'utente con ID ${userId} è stato sbannato.` });
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('kick')
      .setDescription('Espelle un membro dal server')
      .addUserOption((option) => option.setName('utente').setRequired(true).setDescription('Utente da espellere'))
      .addStringOption((option) => option.setName('motivo').setDescription('Motivo dell\'espulsione').setRequired(false)),
    async execute(interaction) {
      if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) {
        return interaction.reply({ content: 'Non hai i permessi per eseguire questo comando.', ephemeral: true });
      }

      const member = interaction.options.getMember('utente');
      const reason = interaction.options.getString('motivo') || 'Nessun motivo specificato';

      await member.kick(reason);
      addModerationLog({guildId: interaction.guild.id, type: 'kick', moderatorId: interaction.user.id, targetId: member.id, reason});
      await interaction.reply({ content: `Utente ${member.user.tag} espulso. Motivo: ${reason}` });
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('timeout')
      .setDescription('Imposta un timeout a un membro')
      .addUserOption((option) => option.setName('utente').setRequired(true).setDescription('Utente da timeoutare'))
      .addIntegerOption((option) => option.setName('minuti').setDescription('Durata in minuti').setRequired(true).setMinValue(1).setMaxValue(10080)),
    async execute(interaction) {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        return interaction.reply({ content: 'Non hai i permessi.', ephemeral: true });
      }

      const member = interaction.options.getMember('utente');
      const minutes = interaction.options.getInteger('minuti');
      await member.timeout(minutes * 60 * 1000, 'Timeout tramite comandi slash');
      addModerationLog({guildId: interaction.guild.id, type: 'timeout', moderatorId: interaction.user.id, targetId: member.id, reason: `${minutes} minuti`});
      await interaction.reply({ content: `Timeout impostato a <@${member.id}> per ${minutes} minuti.` });
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('untimeout')
      .setDescription('Rimuove il timeout da un membro')
      .addUserOption((option) => option.setName('utente').setRequired(true).setDescription('Utente da rimuovere dal timeout')),
    async execute(interaction) {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        return interaction.reply({ content: 'Non hai i permessi.', ephemeral: true });
      }

      const member = interaction.options.getMember('utente');
      await member.timeout(null, 'Timeout rimosso tramite comando slash');
      addModerationLog({guildId: interaction.guild.id, type: 'untimeout', moderatorId: interaction.user.id, targetId: member.id, reason: 'Timeout rimosso'});
      await interaction.reply({ content: `Timeout rimosso da <@${member.id}>.` });
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('warn')
      .setDescription('Avvisa un membro')
      .addUserOption((option) => option.setName('utente').setRequired(true).setDescription('Utente da avvisare'))
      .addStringOption((option) => option.setName('motivo').setDescription('Motivo dell\'avviso').setRequired(true)),
    async execute(interaction) {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        return interaction.reply({ content: 'Non hai i permessi.', ephemeral: true });
      }

      const user = interaction.options.getUser('utente');
      const reason = interaction.options.getString('motivo');
      addWarning({ guildId: interaction.guild.id, userId: user.id, moderatorId: interaction.user.id, reason });
      addModerationLog({ guildId: interaction.guild.id, type: 'warn', moderatorId: interaction.user.id, targetId: user.id, reason });
      await interaction.reply({ content: `Ho registrato un avviso per <@${user.id}>: ${reason}` });
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('warnings')
      .setDescription('Mostra gli avvisi di un membro')
      .addUserOption((option) => option.setName('utente').setDescription('Utente di cui mostrare gli avvisi').setRequired(false)),
    async execute(interaction) {
      const targetUser = interaction.options.getUser('utente') || interaction.user;
      const warnings = getWarnings(interaction.guild.id, targetUser.id);

      const embed = new EmbedBuilder()
        .setColor('#2B2D31')
        .setTitle(`Avvisi di ${targetUser.tag}`)
        .setDescription(warnings.length ? warnings.map((warning) => `• ${warning.reason} (${new Date(warning.created_at).toLocaleString()})`).join('\n') : 'Nessun avviso registrato.');

      await interaction.reply({ embeds: [embed] });
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('purge')
      .setDescription('Elimina un numero di messaggi')
      .addIntegerOption((option) => option.setName('numero').setDescription('Numero di messaggi da eliminare').setRequired(true).setMinValue(1).setMaxValue(100)),
    async execute(interaction) {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
        return interaction.reply({ content: 'Non hai i permessi.', ephemeral: true });
      }

      const amount = interaction.options.getInteger('numero');
      const messages = await interaction.channel.messages.fetch({ limit: amount });
      await interaction.channel.bulkDelete(messages, true);
      addModerationLog({guildId: interaction.guild.id, type: 'purge', moderatorId: interaction.user.id, targetId: interaction.channel.id, reason: `${amount} messaggi rimossi`});
      await interaction.reply({ content: `${amount} messaggi eliminati.`, ephemeral: true });
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('clear')
      .setDescription('Pulisce il canale o i messaggi recenti')
      .addIntegerOption((option) => option.setName('numero').setDescription('Numero di messaggi da cancellare').setRequired(true).setMinValue(1).setMaxValue(100)),
    async execute(interaction) {
      return interaction.reply({ content: 'Questo comando è una scorciatoia di `purge` e può essere gestito in modo esteso con un modulo dedicato.', ephemeral: true });
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('lock')
      .setDescription('Blocca il canale corrente')
      .addStringOption((option) => option.setName('motivo').setDescription('Motivo del blocco').setRequired(false)),
    async execute(interaction) {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
        return interaction.reply({ content: 'Non hai i permessi.', ephemeral: true });
      }

      const reason = interaction.options.getString('motivo') || 'Blocco moderazione';
      await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false });
      addModerationLog({guildId: interaction.guild.id, type: 'lock', moderatorId: interaction.user.id, targetId: interaction.channel.id, reason});
      await interaction.reply({ content: `Canale bloccato. Motivo: ${reason}` });
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('unlock')
      .setDescription('Sblocca il canale corrente')
      .addStringOption((option) => option.setName('motivo').setDescription('Motivo dello sblocco').setRequired(false)),
    async execute(interaction) {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
        return interaction.reply({ content: 'Non hai i permessi.', ephemeral: true });
      }

      const reason = interaction.options.getString('motivo') || 'Sblocco moderazione';
      await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: null });
      addModerationLog({guildId: interaction.guild.id, type: 'unlock', moderatorId: interaction.user.id, targetId: interaction.channel.id, reason});
      await interaction.reply({ content: `Canale sbloccato. Motivo: ${reason}` });
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('modlogs')
      .setDescription('Mostra l\'ultimo log di moderazione del server'),
    async execute(interaction) {
      const logs = getModerationLogs(interaction.guild.id);
      const embed = new EmbedBuilder()
        .setColor('#2B2D31')
        .setTitle('Modlogs')
        .setDescription(logs.length ? logs.map((log) => `• ${log.type} | ${log.reason || 'Nessun motivo'} | <@${log.target_id}>`).slice(0, 10).join('\n') : 'Nessun log registrato.');

      await interaction.reply({ embeds: [embed] });
    }
  }
];

module.exports = { commands };
