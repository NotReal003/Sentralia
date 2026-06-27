const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const SecurityLogSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  ip: { type: String, default: '' },
  city: { type: String, default: '' },
  country: { type: String, default: '' },
  device: { type: String, default: '' },
  userAgent: { type: String, default: '' },
  success: { type: Boolean, default: true },
  reason: { type: String, default: '' },
}, { _id: false });

const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  email: { type: String, default: '' },
  username: { type: String, required: true },
  displayName: { type: String, default: '' },
  avatarHash: { type: String, default: '' },
  accessToken: { type: String, default: '' },
  refreshToken: { type: String, default: '' },
  authType: { type: String, default: '' },
  verificationCode: { type: String, default: '' },
  verificationCodeExpires: { type: Date },
  status: { type: String, default: '' },
  joinedAt: { type: Date, default: Date.now },
  staff: { type: Boolean, default: false },
  admin: { type: Boolean, default: false },
  owner: { type: Boolean, default: false },
  lastLogin: { type: Date },
  lastIP: { type: String, default: '' },
  lastDevice: { type: String, default: '' },
  lastLocation: {
    city: { type: String, default: '' },
    country: { type: String, default: '' },
  },
  securityLogs: { type: [SecurityLogSchema], default: [] },
  ip: { type: String, default: '' },
  device: { type: String, default: '' },
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function findAltAccounts(targetUserId) {
  try {
    const target = await User.findOne({ id: targetUserId })
      .select('id username email lastIP lastDevice lastLocation securityLogs joinedAt lastLogin')
      .lean();

    if (!target) return [];

    const knownIPs = new Map();
    const knownDevices = new Map();
    const knownAgents = new Map();
    const knownCities = new Set();
    const targetEmailPrefix = target.email?.split('@')[0] || null;
    const targetUsername = target.username.toLowerCase();

    const logs = [...(target.securityLogs || []), target];
    for (const log of logs) {
      if (log.ip) knownIPs.set(log.ip, (knownIPs.get(log.ip) || 0) + 1);
      if (log.device) knownDevices.set(log.device, (knownDevices.get(log.device) || 0) + 1);
      if (log.userAgent) knownAgents.set(log.userAgent, (knownAgents.get(log.userAgent) || 0) + 1);
      if (log.city) knownCities.add(log.city.toLowerCase());
    }

    const ipSubnets = Array.from(knownIPs.keys())
      .filter(ip => ip && ip.includes('.'))
      .map(ip => ip.split('.').slice(0, 3).join('.') + '.');

    const strongIPs = Array.from(knownIPs.keys());
    const strongDevices = Array.from(knownDevices.keys());

    const query = {
      id: { $ne: targetUserId },
      $or: [
        { lastIP: { $in: strongIPs } },
        { lastDevice: { $in: strongDevices } },
        { 'securityLogs.ip': { $in: strongIPs } },
        { 'securityLogs.device': { $in: strongDevices } },
        ...(ipSubnets.length
          ? [{ lastIP: { $regex: new RegExp(`^(${ipSubnets.map(s => s.replace('.', '\\.')).join('|')})`, 'i') } }]
          : []),
      ],
    };

    const candidates = await User.find(query)
      .select('id username email lastIP lastDevice lastLogin joinedAt lastLocation securityLogs avatarHash authType')
      .limit(250)
      .lean();

    const results = [];

    for (const alt of candidates) {
      let score = 0;
      const reasons = new Set();
      const altEmailPrefix = alt.email?.split('@')[0] || null;
      const altUsername = alt.username.toLowerCase();
      const altIPs = new Set([alt.lastIP, ...alt.securityLogs.map(l => l.ip).filter(Boolean)]);
      const altDevices = new Set([alt.lastDevice, ...alt.securityLogs.map(l => l.device).filter(Boolean)]);
      const altAgents = new Set([alt.lastDevice, ...alt.securityLogs.map(l => l.userAgent).filter(Boolean)]);

      if (targetEmailPrefix && altEmailPrefix && targetEmailPrefix === altEmailPrefix && targetEmailPrefix.length > 3) {
        score += 20;
        reasons.add('Shared Email Prefix');
      }
      if (knownDevices.has(alt.lastDevice) || (target.lastDevice && altDevices.has(target.lastDevice))) {
        score += 15;
        reasons.add('Shared Last Device');
      }
      if (knownIPs.has(alt.lastIP) || (target.lastIP && altIPs.has(target.lastIP))) {
        score += 10;
        reasons.add('Shared Last IP');
      }
      const sharedLogDevices = Array.from(altDevices).filter(d => knownDevices.has(d));
      if (sharedLogDevices.length > 0 && !reasons.has('Shared Last Device')) {
        score += 8;
        reasons.add('Shared Historical Device');
      }
      const sharedLogIPs = Array.from(altIPs).filter(ip => knownIPs.has(ip));
      if (sharedLogIPs.length > 0 && !reasons.has('Shared Last IP')) {
        score += 5;
        reasons.add('Shared Historical IP');
      }
      if (target.joinedAt && alt.joinedAt) {
        const joinDiff = Math.abs(new Date(target.joinedAt) - new Date(alt.joinedAt)) / (1000 * 60);
        if (joinDiff <= 24 * 60) {
          score += 5;
          reasons.add('Near Join Date');
        }
      }
      if (targetUsername.length > 4 && altUsername.length > 4) {
        if (altUsername.startsWith(targetUsername) || targetUsername.startsWith(altUsername)) {
          score += 4;
          reasons.add('Similar Username');
        }
      }
      if (ipSubnets.some(p => alt.lastIP?.startsWith(p)) && !reasons.has('Shared Last IP')) {
        score += 3;
        reasons.add('Same IP Subnet');
      }
      if (target.lastLogin && alt.lastLogin) {
        const loginDiff = Math.abs(new Date(target.lastLogin) - new Date(alt.lastLogin)) / (1000 * 60);
        if (loginDiff <= 10) {
          score += 3;
          reasons.add('Near Login Time');
        }
      }
      const sharedAgents = Array.from(altAgents).filter(a => knownAgents.has(a));
      if (sharedAgents.length > 0) {
        score += 2;
        reasons.add('Shared User Agent');
      }
      if (alt.lastLocation?.city && knownCities.has(alt.lastLocation.city.toLowerCase())) {
        score += 0.5;
        reasons.add('Same City');
      }
      if (/vpn|proxy|tor|cloud|aws|azure|gcp|digitalocean|linode|ovh|datacenter/i.test(alt.lastIP || '')) {
        score -= 5;
      }

      if (score >= 8) {
        const matchLevel =
          score >= 20 ? 'High' : score >= 12 ? 'Medium' : 'Low';
        results.push({
          ...alt,
          matchScore: Math.round(score * 10) / 10,
          matchLevel,
          matchReason: Array.from(reasons).join(' & '),
        });
      }
    }

    results.sort((a, b) => b.matchScore - a.matchScore);
    return results.slice(0, 100);

  } catch (err) {
    console.error(`[AltDetector v2] Error for ${targetUserId}:`, err);
    return [];
  }
}



function maskEmail(email) {
  if (typeof email !== "string" || !email.includes("@")) {
    return 'i*******d@invalid.com';
  }
  try {
    const trimmedEmail = email.trim().toLowerCase();
    const [localPart, domain] = trimmedEmail.split("@");
    if (!localPart || !domain) { return 'i*******d@invalid.com'; }
    if (localPart.length <= 2) { return `${localPart.at(0) || ''}***@${domain}`; }
    const firstChar = localPart.at(0);
    const lastChar = localPart.at(-1);
    const maskedPart = "*".repeat(Math.max(1, localPart.length - 2));
    return `${firstChar}${maskedPart}${lastChar}@${domain}`;
  } catch (e) {
    console.error("Email masking failed:", e);
    return 'e*******r@error.com';
  }
}

router.get('/:userId', async (req, res) => {
  const { userId } = req.params;
  const user = await req.user;

  if (!user) {
    return res.status(401).json({ code: 0, message: 'U: Unauthorized' });
  }

  if (user.id === process.env.ADMIN_ID || user.admin === true) {
    user.isAdmin = true;
  }
  if (!user.isAdmin) {
    return res.status(403).json({ code: 0, message: 'You do not have permission to manage this request.' });
  }

  if (!mongoose.connection.readyState) {
      return res.status(503).json({ message: 'Database connection not ready.' });
  }

  try {
    const targetUser = await User.findOne({ id: userId })
      .select('id username lastIP lastDevice email joinedAt lastLogin')
      .lean()
      .exec();

    if (!targetUser) {
      return res.status(404).json({ message: `Target User ID ${userId} not found.` });
    }

    const altAccounts = await findAltAccounts(targetUser.id);

    const results = altAccounts.map(alt => {
      const fallbackReasons = [];
      if (alt.lastIP === targetUser.lastIP) {
          fallbackReasons.push('Shared Last IP');
      }
      if (alt.lastDevice === targetUser.lastDevice) {
          fallbackReasons.push('Shared Last Device');
      }

      return {
          id: alt.id,
          username: alt.username,
          email: maskEmail(alt.email),
          joinedAt: alt.joinedAt,
          lastIP: alt.lastIP,
          lastDevice: alt.lastDevice,
          matchReason: alt.matchReason || fallbackReasons.join(' & '),
          matchScore: alt.matchScore || 0,
          matchLevel: alt.matchLevel || 'Low',
          avatarHash: alt.avatarHash, // <-- ADDED
          authType: alt.authType,   // <-- ADDED
      };
    });

    res.status(200).json({
      targetUser: {
        id: targetUser.id,
        username: targetUser.username,
        lastIP: targetUser.lastIP,
        lastDevice: targetUser.lastDevice
      },
      altAccounts: results,
      count: results.length,
    });

  } catch (error) {
    console.error(`[Admin Alt Route] Server error for user ${userId}:`, error);
    res.status(500).json({ message: 'An internal server error occurred during alt detection.' });
  }
});

module.exports = router;
