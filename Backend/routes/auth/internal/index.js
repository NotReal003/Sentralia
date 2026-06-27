const express = require('express');
const router = express.Router();
const Blacklist = require('../../../models/Blacklist');
const jwt = require('jsonwebtoken');

router.get('/signin', (req, res) => {
  const redirectPath = req.query.redirect || '/profile';
  const state = encodeURIComponent(redirectPath);

  const url = `https://discord.com/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}` +
              `&response_type=code` +
              `&redirect_uri=${encodeURIComponent(process.env.DISCORD_REDIRECT_URI)}` +
              `&scope=identify+email` +
              `&state=${state}`;

  res.redirect(url);
});

router.get('/github', (req, res) => {
  const clientId = process.env.G_ID;
  const backUrl = 'https://request.notreal003.xyz';
  const redirectUri = 'https://request.notreal003.xyz/github/callback';
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user:email`;

  res.redirect(backUrl);
});

router.get('/signout', async (req, res) => {
  const token = req.cookies.token || req.headers['authorization'];

  if (!token) {
    res.clearCookie('token', { httpOnly: true, secure: true });
    return res.status(400).json({ message: "You aren't verified, please refresh the page." });
  }

  try {
    const savedToken = await Blacklist.findOne({ blacklistToken: token });
    if (savedToken) {
      res.clearCookie('token', { httpOnly: true, secure: true });
      return res.status(200).json({ message: 'Successfully logged out. Active session found.' });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    await Blacklist.create({ blacklistToken: token, user_id: decodedToken.id });

    res.clearCookie('token', { httpOnly: true, secure: true });
    return res.status(200).json({ message: 'Successfully logged out.' });
  } catch (err) {
    if (err) {
      res.clearCookie('token', { httpOnly: true, secure: true });
      return res.status(406).json({ message: 'Invalid or expired session' });
    }

    next(error);
    return res.status(500).json({ message: 'Error during logout. Please try again later.' });
  }
});


module.exports = router;
