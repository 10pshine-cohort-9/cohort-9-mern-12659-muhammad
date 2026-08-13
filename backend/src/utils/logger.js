const pino = require('pino');

const logger = pino({
  transport: { target: 'pino-pretty' },
  redact: { paths: ['req.headers.authorization'], remove: true },
});

module.exports = logger;
