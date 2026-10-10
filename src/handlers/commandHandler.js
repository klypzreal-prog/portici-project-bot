const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(process.cwd(), 'logs');
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const getTimestamp = () => new Date().toISOString();

function write(level, message, meta) {
  const content = meta ? `${message} ${JSON.stringify(meta)}` : message;
  const fileName = `bot-${new Date().toISOString().slice(0, 10)}.log`;
  const filePath = path.join(LOG_DIR, fileName);

  fs.appendFileSync(filePath, `[${getTimestamp()}] [${level}] ${content}\n`, 'utf8');
  // eslint-disable-next-line no-console
  console.log(`[${level}] ${message}`);
}

module.exports = {
  info: (message, meta) => write('INFO', message, meta),
  warn: (message, meta) => write('WARN', message, meta),
  error: (message, error) => write('ERROR', `${message}${error ? `: ${error.stack || error.message || String(error)}` : ''}`),
  debug: (message, meta) => write('DEBUG', message, meta)
};
