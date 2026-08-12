const logger = require('../utils/logger');


function errorHandler(err, req, res, next) {
  logger.error({ err }, err.message);

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  if (err.code === 11000) {
    statusCode = 409;
    message = 'Email already in use';
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid value for field: ${err.path}`;
  }

  if (process.env.NODE_ENV === 'production') {
    message = statusCode === 500 ? 'Internal Server Error' : message;
  }

  res.status(statusCode).json({ success: false, data: null, message });
};

module.exports = errorHandler;
