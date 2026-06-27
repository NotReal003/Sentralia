const axios = require('axios');
require('dotenv').config();

const WEBHOOK_URL = process.env.ERROR_WEBHOOK;

const errorHandler = async (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  let error = { ...err };
  error.message = err.message;

  if (err.name === 'CastError') {
    error.message = 'Resource not found or invalid ID format';
    error.statusCode = 400;
  }

  if (err.code === 11000) {
    error.message = 'Duplicate field value entered';
    error.statusCode = 409; // Conflict
  }

  if (err.name === 'ValidationError') {
    error.message = Object.values(err.errors).map(val => val.message).join(', ');
    error.statusCode = 400;
  }

  const statusCode = error.statusCode || err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  console.error(`[API Error] ${req.method} ${req.originalUrl} | Status: ${statusCode} | Message: ${error.message}`);
  
  if (WEBHOOK_URL && statusCode >= 500) {
    
    const cleanStack = err.stack ? err.stack.substring(0, 1000) : 'No stack trace available';
    const cleanMessage = error.message ? error.message.substring(0, 1000) : 'Unknown Error';
    
    const clientIp = req.headers['cf-connecting-ip'] || 
                     req.headers['x-forwarded-for'] || 
                     req.socket.remoteAddress || 'Unknown';

    const embed = {
      title: '🚨 API Critical Error',
      description: 'An unhandled exception occurred in the backend.',
      color: 16711680, // Red
      fields: [
        { name: 'Route', value: `\`${req.method} ${req.originalUrl}\``, inline: true },
        { name: 'Status', value: `${statusCode}`, inline: true },
        { name: 'Client IP', value: clientIp, inline: true },
        { name: 'Error Message', value: `\`\`\`${cleanMessage}\`\`\`` },
        { name: 'Stack Trace', value: `\`\`\`js\n${cleanStack}\n\`\`\`` }
      ],
      timestamp: new Date().toISOString()
    };

    axios.post(WEBHOOK_URL, { embeds: [embed] })
      .catch(discordErr => {
        console.error('Failed to send error alert to Discord:', discordErr.message);
      });
  }

  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? 'Internal Server Error' : error.message,
    ...( !isProduction && { stack: err.stack }),
  });
};

module.exports = errorHandler;
