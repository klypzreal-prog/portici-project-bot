const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const { DATABASE_PATH } = require('../config');

const databaseDir = path.dirname(DATABASE_PATH);

if (!fs.existsSync(databaseDir)) {
  fs.mkdirSync(databaseDir, { recursive: true });
}

const db = new Database(DATABASE_PATH);

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    guild_id TEXT PRIMARY KEY,
    log_channel_id TEXT,
    ticket_category_id TEXT,
    boost_channel_id TEXT,
    boost_role_id TEXT,
    moderation_role_id TEXT,
    admin_role_id TEXT,
    anti_nuke_enabled INTEGER DEFAULT 1,
    anti_raid_enabled INTEGER DEFAULT 1,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS warnings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    moderator_id TEXT,
    reason TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS moderation_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    type TEXT NOT NULL,
    moderator_id TEXT,
    target_id TEXT,
    reason TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    owner_id TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT DEFAULT 'open',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS boost_events (
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    sent_at TEXT DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (guild_id, user_id)
  );
`);

function ensureGuildSettings(guildId) {
  const existing = db.prepare('SELECT * FROM settings WHERE guild_id = ?').get(guildId);

  if (!existing) {
    db.prepare(`
      INSERT INTO settings (guild_id) VALUES (?)
    `).run(guildId);
  }
}

function getSettings(guildId) {
  ensureGuildSettings(guildId);
  return db.prepare('SELECT * FROM settings WHERE guild_id = ?').get(guildId);
}

function setSettings(guildId, values) {
  const existing = getSettings(guildId);
  if (!existing) {
    ensureGuildSettings(guildId);
  }

  const keys = Object.keys(values);
  const assignments = keys.map((key) => `${key} = ?`).join(', ');
  const valuesList = keys.map((key) => values[key]);

  db.prepare(`UPDATE settings SET ${assignments}, updated_at = CURRENT_TIMESTAMP WHERE guild_id = ?`).run(...valuesList, guildId);
  return getSettings(guildId);
}

function addWarning({ guildId, userId, moderatorId, reason }) {
  db.prepare(`INSERT INTO warnings (guild_id, user_id, moderator_id, reason) VALUES (?, ?, ?, ?)`)
    .run(guildId, userId, moderatorId, reason || 'Nessuna motivazione specificata');
}

function getWarnings(guildId, userId) {
  return db.prepare('SELECT * FROM warnings WHERE guild_id = ? AND user_id = ? ORDER BY created_at DESC').all(guildId, userId);
}

function addModerationLog({ guildId, type, moderatorId, targetId, reason }) {
  db.prepare(`INSERT INTO moderation_logs (guild_id, type, moderator_id, target_id, reason) VALUES (?, ?, ?, ?, ?)`)
    .run(guildId, type, moderatorId || null, targetId || null, reason || 'Nessuna motivazione specificata');
}

function getModerationLogs(guildId) {
  return db.prepare('SELECT * FROM moderation_logs WHERE guild_id = ? ORDER BY created_at DESC LIMIT 25').all(guildId);
}

function addTicket({ guildId, channelId, ownerId, type }) {
  db.prepare('INSERT INTO tickets (guild_id, channel_id, owner_id, type) VALUES (?, ?, ?, ?)')
    .run(guildId, channelId, ownerId, type);
}

function closeTicket(channelId) {
  db.prepare('UPDATE tickets SET status = ? WHERE channel_id = ?').run('closed', channelId);
}

function getTicketByChannel(channelId) {
  return db.prepare('SELECT * FROM tickets WHERE channel_id = ? ORDER BY created_at DESC LIMIT 1').get(channelId);
}

function addBoostEvent(guildId, userId) {
  db.prepare('INSERT OR IGNORE INTO boost_events (guild_id, user_id) VALUES (?, ?)').run(guildId, userId);
}

function hasBoostEvent(guildId, userId) {
  const row = db.prepare('SELECT 1 FROM boost_events WHERE guild_id = ? AND user_id = ?').get(guildId, userId);
  return Boolean(row);
}

module.exports = {
  db,
  initDatabase: () => db,
  getSettings,
  setSettings,
  addWarning,
  getWarnings,
  addModerationLog,
  getModerationLogs,
  addTicket,
  closeTicket,
  getTicketByChannel,
  addBoostEvent,
  hasBoostEvent
};
