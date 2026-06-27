/**
 * Express Router for Alt Account Detection
 *
 * Route: GET /:userId
 * Finds potential alternate accounts for a given user ID based on shared
 * 'lastIP' or 'lastDevice' metadata.
 *
 * NOTE: This file assumes an authentication middleware has populated 'req.user'
 * with the Mongoose User document/object.
 */

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
  admin: { type: Boolean, default: false }, // Crucial for auth check
  owner: { type: Boolean, default: false },
  lastLogin: { type: Date },
  lastIP: { type: String, default: '' },
  lastDevice: { type: String, default: '' },
  lastLocation: {
    city: { type: String, default: '' },
    country: { type: String, default: '' },
  },
  securityLogs: { type: [SecurityLogSchema], default: [] },
  ip: { type: String, default: '' }, // Legacy
  device: { type: String, default: '' }, // Legacy
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);


/**
 * Finds potential alt accounts by matching users who share the same lastIP
 * or lastDevice ID as the target user, excluding the target user.
 */
async function findAltAccounts(targetUserId, targetLastIP, targetLastDevice) {
  const orConditions = [];

  if (targetLastIP && targetLastIP !== '') {
    orConditions.push({ lastIP: targetLastIP });
  }

  if (targetLastDevice && targetLastDevice !== '') {
    orConditions.push({ lastDevice: targetLastDevice });
  }

  if (orConditions.length === 0) {
    return []; // No data to match on
  }

  const query = {
    id: { $ne: targetUserId },
    $or: orConditions,
  };

  try {
    const alts = await User.find(query)
      .select('id username lastIP lastDevice lastLogin joinedAt email')
      .limit(100)
      .lean()
      .exec();

    return alts;
  } catch (error) {
    console.error(`[AltDetector] Database query failed for user ${targetUserId}:`, error);
    return [];
  }
}


/**
 * GET /:userId
 * Fetches alt accounts for the user specified in the URL parameter.
 */
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;
  const user = req.user; // Assumes auth middleware has populated req.user

  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (!user.admin) {
    return res.status(403).json({ message: 'You do not have permission to view this area.' });
  }

  if (!mongoose.connection.readyState) {
      return res.status(503).json({ message: 'Database connection not ready.' });
  }

  try {
    const targetUser = await User.findOne({ id: userId })
      .select('id username lastIP lastDevice')
      .lean()
      .exec();

    if (!targetUser) {
      return res.status(404).json({ message: `Target User ID ${userId} not found.` });
    }

    const altAccounts = await findAltAccounts(targetUser.id, targetUser.lastIP, targetUser.lastDevice);

    const results = altAccounts.map(alt => {
        const reasons = [];
        if (alt.lastIP === targetUser.lastIP) {
            reasons.push('Shared Last IP');
        }
        if (alt.lastDevice === targetUser.lastDevice) {
            reasons.push('Shared Last Device');
        }

        return {
            id: alt.id,
            username: alt.username,
            email: alt.email,
            joinedAt: alt.joinedAt,
            lastIP: alt.lastIP,
            lastDevice: alt.lastDevice,
            matchReason: reasons.join(' & '),
        };
    });

    res.status(200).json({
      targetUser: { id: targetUser.id, username: targetUser.username, lastIP: targetUser.lastIP, lastDevice: targetUser.lastDevice },
      altAccounts: results,
      count: results.length,
    });

  } catch (error) {
    console.error(`[Admin Alt Route] Server error for user ${userId}:`, error);
    res.status(500).json({ message: 'An internal server error occurred during alt detection.' });
  }
});

module.exports = router;
