const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };
const minLevel = LEVELS[process.env.LOG_LEVEL] || LEVELS.info;

function write(level, message, meta) {
  if (LEVELS[level] < minLevel) return;

  const time = new Date().toISOString();
  const line = `[${time}] ${level.toUpperCase().padEnd(5)} ${message}`;
  const output = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;

  if (meta === undefined) output(line);
  else output(line, meta instanceof Error ? meta.stack || meta.message : meta);
}

export const logger = {
  debug: (message, meta) => write('debug', message, meta),
  info: (message, meta) => write('info', message, meta),
  warn: (message, meta) => write('warn', message, meta),
  error: (message, meta) => write('error', message, meta),
};

export default logger;
