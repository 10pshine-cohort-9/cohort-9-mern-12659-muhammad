const pino = require('pino');

const logger = pino({
  transport:
    process.env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty' }
      : undefined,
  redact: { paths: ['req.headers.authorization'], remove: true },
});

module.exports = logger;
