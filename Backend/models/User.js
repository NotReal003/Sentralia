const mongoose = require('mongoose');

const SecurityLogSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  ip: { type: String, default: '' },
  city: { type: String, default: '' },
  country: { type: String, default: '' },
  device: { type: String, default: '' },
  userAgent: { type: String, default: '' },
  success: { type: Boolean, default: true },
  reason: { type: String, default: '' },
});

const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // Discord or OAuth ID
  email: { type: String, default: '' },
  username: { type: String, required: true },
  displayName: { type: String, default: '' },
  avatarHash: { type: String, default: '' },

  accessToken: { type: String, default: '' },
  refreshToken: { type: String, default: '' },
  authType: { type: String, default: '' }, // 'discord', 'google', etc.

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

module.exports = mongoose.model('User', UserSchema);
