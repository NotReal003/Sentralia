const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const User = require('../../../models/User');
const passport = require('passport'); // Keep this if you use it elsewhere, though it's not used in the callback
const parser = require('ua-parser-js'); // Added from Discord route
require('dotenv').config();

const router = express.Router();

router.get('/', (req, res, next) => {
  const { state } = req.query;
  const authUrl = passport.authenticate('google', {
    scope: ['profile', 'email'],
    state: state || encodeURIComponent('/profile'), // Pass state to Google
  });
  authUrl(req, res, next);
});

router.get('/callback', async (req, res, next) => {
  const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
  const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';
  const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  const REDIRECT_URI = process.env.GOOGLE_CLIENT_REDIRECT;

  const { code, state } = req.query;
  const redirectPath = state ? decodeURIComponent(state) : '/profile';

  if (!code) {
    return res.status(400).json({
      message: `Missing authorization code. Please close this window and try again.`,
    });
  }


  const userIp =
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket.remoteAddress ||
    'Unknown';

  const userAgent = req.headers['user-agent'] || 'Unknown';
  const parsedUA = parser(userAgent);


  let geo = {}; // Default empty geo object

  if (userIp !== 'Unknown' && userIp !== '127.0.0.1' && !userIp.startsWith('::1')) {
    try {
      const geoRes = await axios.get(`http://ip-api.com/json/${userIp}`);

      if (geoRes.data && geoRes.data.status === 'success') {
        geo = geoRes.data;
      }
    } catch (geoError) {
      console.error(`Failed to geolocate IP ${userIp}:`, geoError.message);
    }
  }

  const location = {
    ip: userIp,
    country: geo.countryCode || 'Unknown', // e.g., 'IN'
    region: geo.regionName || 'Unknown', // e.g., 'Gujarat'
    city: geo.city || 'Unknown',         // e.g., 'Ahmedabad'
    coordinates: (geo.lat && geo.lon) ? [geo.lon, geo.lat] : [],
    timezone: geo.timezone || 'Unknown',
  };


  const clientData = {
    timezone: req.headers['x-user-timezone'] || 'Unknown',
    screenResolution: req.headers['x-screen-resolution'] || 'Unknown',
    viewport: req.headers['x-viewport'] || 'Unknown',
    colorDepth: req.headers['x-color-depth'] || 'Unknown',
    language: req.headers['accept-language']?.split(',')[0] || 'Unknown',
    referrer: req.headers['referer'] || 'Unknown',
    origin: req.headers['origin'] || 'Unknown',
    previousPage: req.headers['x-prev-page'] || 'Unknown',
    host: req.headers['host'] || 'Unknown',
    clientClock: req.headers['x-client-timestamp'] || null,
    clockSkewMs: req.headers['x-client-timestamp']
      ? Date.now() - Number(req.headers['x-client-timestamp'])
      : null,
    hardware: {
      cpuCores: req.headers['x-cpu-cores'] || 'Unknown',
      deviceMemory: req.headers['x-device-memory'] || 'Unknown',
      touchSupport: req.headers['x-touch-support'] || 'Unknown',
    },
    connection: {
      type: req.headers['x-network-type'] || 'Unknown',
      secure: req.secure || false,
      protocol: req.protocol,
      tlsVersion: req.socket.getProtocol?.() || 'Unknown',
    },
  };

  const headersFingerprint = {
    userAgent,
    accept: req.headers['accept'] || '',
    acceptEncoding: req.headers['accept-encoding'] || '',
    acceptLanguage: req.headers['accept-language'] || '',
    dnt: req.headers['dnt'] || 'Not Specified',
    secChUa: req.headers['sec-ch-ua'] || '',
    secChUaMobile: req.headers['sec-ch-ua-mobile'] || '',
    secChUaPlatform: req.headers['sec-ch-ua-platform'] || '',
    secFetchDest: req.headers['sec-fetch-dest'] || '',
    secFetchMode: req.headers['sec-fetch-mode'] || '',
    secFetchSite: req.headers['sec-fetch-site'] || '',
    secFetchUser: req.headers['sec-fetch-user'] || '',
    cfRay: req.headers['cf-ray'] || '',
    via: req.headers['via'] || '',
    xForwardedProto: req.headers['x-forwarded-proto'] || '',
    xRealIp: req.headers['x-real-ip'] || '',
    forwarded: req.headers['forwarded'] || '',
  };

  const puaDevice = parsedUA.device || {};
  const deviceString = [puaDevice.vendor, puaDevice.model]
    .filter(Boolean)
    .join(' ')
    .trim();

  const securityMeta = {
    timestamp: new Date().toISOString(),
    ip: location.ip,
    city: location.city,
    country: location.country,
    device: deviceString || puaDevice.type || 'Unknown',
    userAgent: userAgent,
    success: true,
    reason: 'Google OAuth Login', // Changed from 'Discord'
  };

  try {
    const oauthRes = await axios.post(
      GOOGLE_TOKEN_URL,
      new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI,
        code,
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );

    if (!oauthRes.data.access_token) {
      return res.status(500).json({
        message: 'OAuth exchange failed. ErrorType: TokenExchange',
      });
    }
    
    const accessToken = oauthRes.data.access_token;
    const refreshToken = oauthRes.data.refresh_token; // Google often only provides this on first login

    const userRes = await axios.get(GOOGLE_USERINFO_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const gUser = userRes.data; // Google User

    if (!gUser.email || !gUser.verified_email) {
      return res.status(400).json({
        message:
          'Your Google account has no verified email linked. Please verify your email on Google before signing in.',
      });
    }

    let user = await User.findOne({ id: gUser.id });
    const duplicateEmail = await User.findOne({ email: gUser.email });

    if (duplicateEmail && duplicateEmail.id !== gUser.id && duplicateEmail.authType !== 'google') {
      return res.status(400).json({
        message: `This email is already in use under another login method (${duplicateEmail.authType}). Please log in accordingly.`,
      });
    }

    if (!user) {
      let usernameBase = gUser.name.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
      let username = usernameBase;
      let existingUser = await User.findOne({ username });
      let count = 1;
      while (existingUser) {
        username = `${usernameBase}${count++}`;
        existingUser = await User.findOne({ username });
      }

      user = new User({
        id: gUser.id, // Use Google's ID
        email: gUser.email,
        username,
        avatarHash: gUser.picture, // Google provides a full URL
        accessToken, // Save the Google access token
        refreshToken: refreshToken || null,
        displayName: gUser.name,
        staff: false,
        admin: false,
        authType: 'google', // Set authType
        lastLogin: securityMeta.timestamp,
        lastIP: location.ip,
        lastDevice: userAgent,
        lastLocation: { city: location.city, country: location.country },
        securityLogs: [securityMeta],
        ip: location.ip,
        device: userAgent,
      });
    } else {
      user.email = gUser.email;
      user.avatarHash = gUser.picture; // Update picture
      user.accessToken = accessToken;
      if (refreshToken) user.refreshToken = refreshToken; // Only update if Google sent a new one
      user.displayName = gUser.name;
      user.authType = 'google';
      user.lastLogin = securityMeta.timestamp;
      user.lastIP = location.ip;
      user.lastDevice = userAgent;
      user.lastLocation = { city: location.city, country: location.country };

      user.securityLogs = user.securityLogs || [];
      user.securityLogs.push(securityMeta);
      if (user.securityLogs.length > 15) user.securityLogs.shift();
    }

    await user.save();

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(200).json({
      message: 'Successfully logged in with Google.', // Updated message
      jwtToken: token,
      redirectPath, // Add redirectPath
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatarHash,
      },
    });
  } catch (error) {
    console.error('Error during Google callback:', error.message);
    if (error.response) console.error('Google Error:', error.response.data);
    next(error);
    res.status(500).json({
      message: 'Server error while processing Google login. Please try again later.',
    });
  }
});

module.exports = router;
