const jwt = require('jsonwebtoken');
const axios = require('axios');
const util = require('util');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const Server = require('../models/Server');
const User = require('../models/User');
const Buser = require('../models/Buser');
const Blacklist = require('../models/Blacklist');
const Count = require('../models/Count');
const BannedIP = require('../models/BannedIp');

const verifyJwt = util.promisify(jwt.verify);
const DISCORD_LOG_URL = process.env.WEB_LOGS;

const CONFIG = {
  PUBLIC_PATHS: new Set([
    '/auth/signin', '/auth/callback', '/auth/github/callback', '/auth/signout',
    '/auth/user', '/auth', '/health', '/auth/email-signup', '/auth/email-signin',
    '/auth/verify-email', '/auth/verify-signin-email-code', '/auth/email-signin-verify',
    '/auth/github', '/auth/google', '/auth/google/callback', '/collect/request',
    '/collect/pay', '/collect/social', '/collect/support', '/collect/stream',
    '/collect/request/producthunt', '/collect/demo', '/collect/players', '/collect/product',
    '/collect/linkclicked', '/producthunt', '/source', '/Source', '/players',
    '/video', '/Video', '/season5/file/1', '/season5/file/2', '/minecraft/hotbarslot', '/check-username',
  ]),
  IGNORE_PATHS: new Set(['/health']), // Routes that trigger NO logging
  SERVER_PATHS: new Set(['/server/api-status', '/server/manage-api']),
  REQUEST_PATHS: new Set(['/requests/report', '/requests/support', '/requests/guild']),
  
  DISCORD_IGNORE_PATHS: new Set([
    '/auth/google/callback', 
    '/auth/user', 
    '/auth/callback'
  ]),

  COLORS: {
    PUBLIC: 0x3498db,
    SERVER: 0x11806a,
    SUCCESS: 0x00ff00,
    WARN: 0xffa500,
    ERROR: 0xff0000,
    NOT_FOUND: 0xe74c3c,
  },
  
  IGNORE_LOG_COLORS: new Set([]), 
};

const getClientIp = (req) => {
  const ip = req.headers['cf-connecting-ip'] || 
             req.headers['x-forwarded-for'] || 
             req.socket.remoteAddress || 
             '0.0.0.0';
  return ip.split(',')[0].trim(); // Handle comma-separated headers
};

const LogSystem = {
  queue: [],
  visitBuffer: 0,
  isProcessing: false,

  log: (req, userTitle, color, details = null) => {
    LogSystem.visitBuffer++;

    if (CONFIG.IGNORE_LOG_COLORS.has(color) || CONFIG.DISCORD_IGNORE_PATHS.has(req.path)) return;

    const clientIp = getClientIp(req);
    const ipLink = `[${clientIp}](https://request.notreal003.org/note?text=${clientIp})`;

    const embed = {
      title: details ? 'API Alert' : 'API Route Used',
      color: color,
      fields: [
        { name: 'Route:', value: req.originalUrl || req.path, inline: true },
        { name: 'Method:', value: req.method, inline: true },
        { name: 'Accessed By:', value: userTitle, inline: true },
        { name: 'Client IP:', value: ipLink, inline: true },
      ],
      timestamp: new Date().toISOString(),
    };

    if (details) {
      embed.description = `**Details:** ${details}`;
    }

    LogSystem.queue.push(embed);
  },

  flush: async () => {
    if (LogSystem.isProcessing) return;
    LogSystem.isProcessing = true;

    if (LogSystem.queue.length > 0) {
      const batch = LogSystem.queue.splice(0, 10); // Batch size 10
      try {
        await axios.post(DISCORD_LOG_URL, { embeds: batch });
      } catch (err) {
        console.error('[LogSystem] Discord Webhook Failed:', err.message);
        if (LogSystem.queue.length < 50) LogSystem.queue.unshift(...batch);
      }
    }

    if (LogSystem.visitBuffer > 0) {
      const count = LogSystem.visitBuffer;
      LogSystem.visitBuffer = 0;

      const today = new Date().toISOString().split('T')[0];
      const date = new Date();
      const startOfWeek = new Date(date.setDate(date.getDate() - date.getDay())).toISOString().split('T')[0];
      const monthKey = today.slice(0, 7);

      try {
        await Count.findOneAndUpdate(
          { pageType: 'api' },
          { 
            $inc: { 
              totalVisits: count,
              [`dailyVisits.${today}`]: count,
              [`weeklyVisits.${startOfWeek}`]: count,
              [`monthlyVisits.${monthKey}`]: count
            } 
          },
          { upsert: true }
        );
      } catch (err) {
        console.error('[LogSystem] DB Update Failed:', err.message);
        LogSystem.visitBuffer += count; // Add back to buffer to retry next time
      }
    }

    LogSystem.isProcessing = false;
  }
};

setInterval(LogSystem.flush, 3000);


const rateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1500,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getClientIp(req),
  skip: (req) => {
    return CONFIG.IGNORE_PATHS.has(req.path) || 
           CONFIG.PUBLIC_PATHS.has(req.path) || 
           CONFIG.SERVER_PATHS.has(req.path);
  },
  handler: (req, res, next, options) => {
    LogSystem.log(req, 'Rate Limiter', CONFIG.COLORS.WARN, 'Rate Limit Exceeded (1500/min)');
    res.status(options.statusCode).json(options.message);
  },
  message: { message: 'Too many requests from this IP, please try again after a minute.' },
});


const authMiddleware = async (req, res, next) => {
  const { path, method } = req;

  if (CONFIG.IGNORE_PATHS.has(path)) return next();

  if (CONFIG.PUBLIC_PATHS.has(path)) {
    LogSystem.log(req, 'Public User', CONFIG.COLORS.PUBLIC);
    return next();
  }

  if (CONFIG.SERVER_PATHS.has(path)) {
    LogSystem.log(req, 'Server Admin', CONFIG.COLORS.SERVER);
    return next();
  }

  const token = req.cookies.token || req.headers['authorization'];
  if (!token) {
    LogSystem.log(req, 'Anonymous', CONFIG.COLORS.ERROR, 'Unauthorized - No Token');
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const clientIp = getClientIp(req);
    const ipBase = clientIp.split('.').slice(0, 3).join('.');
    const subnetRegex = new RegExp(`^${ipBase}\\..*$`);

    const [bannedIpDoc, blacklistedToken] = await Promise.all([
      BannedIP.findOne({ 
        $or: [{ ipAddress: clientIp }, { ipAddress: { $regex: subnetRegex } }] 
      }).select('_id').lean(),
      Blacklist.findOne({ blacklistToken: token }).select('_id').lean()
    ]);

    if (bannedIpDoc) {
      LogSystem.log(req, 'Banned Actor', CONFIG.COLORS.ERROR, 'IP Ban Enforced');
      return res.status(406).json({ message: 'Your IP has been banned. Contact support.' });
    }

    if (blacklistedToken) {
      res.clearCookie('token', { httpOnly: true, secure: true });
      LogSystem.log(req, 'Expired Session', CONFIG.COLORS.ERROR, 'Blacklisted Token');
      return res.status(403).json({ message: 'Session expired. Please login again.' });
    }

    const decodedToken = await verifyJwt(token, process.env.JWT_SECRET);

    const targetUser = await User.findOne({ id: decodedToken.id }).lean();
    if (!targetUser) {
      LogSystem.log(req, 'Invalid ID', CONFIG.COLORS.ERROR, 'User Not Found');
      return res.status(403).json({ message: 'Forbidden: User not found' });
    }

    if (CONFIG.REQUEST_PATHS.has(path)) {
      const blockedUser = await Buser.findOne({ user_id: decodedToken.id }).lean();
      if (blockedUser && blockedUser.blocked === 'YES') {
        LogSystem.log(req, targetUser.username, CONFIG.COLORS.ERROR, `Blocked: ${blockedUser.reason}`);
        return res.status(406).json({ message: 'You are blocked from submitting requests.', reason: blockedUser.reason });
      }
    }

    req.user = targetUser;
    LogSystem.log(req, targetUser.username || 'Unknown', CONFIG.COLORS.SUCCESS);
    next();

  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      LogSystem.log(req, 'Invalid Token', CONFIG.COLORS.ERROR, err.message);
      return res.status(403).json({ message: 'Forbidden: Invalid Token' });
    }
    next(err); // Pass unexpected errors to global handler
  }
};

const notFoundHandler = (req, res) => {
  LogSystem.log(req, 'Unknown', CONFIG.COLORS.NOT_FOUND, '404 Not Found');
  res.status(404).json({ message: 'Not Found' });
};

module.exports = {
  rateLimiter,
  authMiddleware,
  notFoundHandler,
  logRouteUsage: (req, user, color, details) => LogSystem.log(req, user, color, details) 
};
