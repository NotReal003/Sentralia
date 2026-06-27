const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const AnalyticsEvent = require('../../models/AnalyticsEvent');
const Count = require('../../models/Count');
const rateLimit = require('express-rate-limit');
const path = require('path');
const axios = require('axios');

router.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

router.get('/check-username', async (req, res) => {
    const { username } = req.query;

    if (!username) {
        return res.status(400).json({ error: 'Username is required' });
    }

    console.log(`\nChecking: ${username}...`);

    try {
        const apiUrl = `https://backend.accounts.hytale.com/api/account/username-reservations/availability`;
        
        const response = await axios.get(apiUrl, {
            params: { username: username },
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Origin': 'https://accounts.hytale.com',
                'Referer': 'https://accounts.hytale.com/'
            },
            validateStatus: function (status) {
                return status < 500; 
            }
        });

        console.log(`API Status: ${response.status}`);
        
        return res.json(response.data);

    } catch (error) {
        console.error('Proxy Error:', error.message);
        
        return res.status(500).json({ error: 'Failed to reach Hytale Backend' });
    }
});


router.get('/images/logo', (req, res) => {
  const imagePath = path.join(__dirname, 'routes', 'admins', 'IMG_3275.jpeg');
  res.sendFile(imagePath);
});

router.get("/source", (req, res) => {
  res.redirect('https://sentralia.notreal003.org');
});

router.get("/producthunt", (req, res) => {
  res.redirect('https://www.producthunt.com/products/request-managemen-portal');
});

router.get("/video", (req, res) => {
  res.redirect('https://youtu.be/Rm79yXU3p80?si=KeoRH2Ayv1-H__y8');
});
router.get("/season5/file/1", (req, res) => {
  res.redirect('https://bit.ly/4rsJERu');
});
router.get("/season5/file/2", (req, res) => {
  res.redirect('https://bit.ly/3Mtv6AR');
});

router.get("/minecraft/hotbarslot", (req, res) => {
  res.redirect('https://shrinkme.click/nZ5fUEg');
});

const adminLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // Only 5 requests per 10 minutes
  message: 'Too many requests. Try again later...',
});

function maskEmail(email) {
  const [localPart, domain] = email.split('@');
  const visiblePart = localPart.slice(-4); // Keep last 4 characters of local part visible
  return `***${visiblePart}@${domain}`;
}
const formatSeries = (data, keyField) => {
  return data.map(item => [item._id[keyField], item.count]);
};

router.get('/visits', async (req, res) => {
  try {
    const user = req.user;
    if (!user || !user.admin) {
      return res.status(user ? 403 : 401).json({ message: 'Unauthorized' });
    }

    const countRecords = await Count.find();

    const pageStats = countRecords.map((record) => ({
      pageType: record.pageType,
      totalVisits: record.totalVisits,
      dailyVisits: Array.from(record.dailyVisits.entries()), // Convert Map to array
      weeklyVisits: Array.from(record.weeklyVisits.entries()), // Weekly details
      monthlyVisits: Array.from(record.monthlyVisits.entries()), // Monthly details
    }));

    res.status(200).json({
      success: true,
      pageStats,
    });
  } catch (error) {
    console.error('Error fetching visit data:', error);
    res.status(500).json({ success: false, message: 'Error fetching visit data.' });
  }
});

router.get('/manage/user/:user', async (req, res) => {
  const users = await req.user;

  if (!users) {
    return res.status(401).json({ code: 0, message: 'Unauthorized' });
  }

  if (users.admin === true) {
    users.isAdmin = true;
  }
  if (users.id === process.env.ADMIN_ID) {
    users.isAdmin = true;
  }

  if (!users.isAdmin) {
    return res.status(403).json({ code: 0, message: 'You do not have permission to manage this area.' });
  }

  try {
    const user = await User.findOne({ id: req.params.user });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.email = maskEmail(user.email),

    res.status(200).json({ user });
  } catch (error) {
    console.error('Error finding user:');
    res.status(500).json({ message: 'There was an error while finding the user. Please try again later.' });
  }
});

router.get('/manage/users/all', adminLimiter, async (req, res) => {
  try {
    const user = await req.user;
    if (!user) {
    return res.status(401).json({ code: 0, message: 'A: Unauthorized' });  
    }
    const myUser = await User.findOne({ id: user.id });
    if (!myUser) {
      return res.status(401).json({ code: 0, message: 'Unauthorized: User not found' });
    }

    const isAdmin = myUser.id === process.env.ADMIN_ID || myUser.admin === true;
    if (!isAdmin) {
      return res.status(403).json({ code: 0, message: 'Admin access required' });
    }

    const users = await User.find({}, '-accessToken -refreshToken');
    if (!users.length) {
      return res.status(404).json({ message: 'No users found' });
    }

    const maskedUsers = users.map(user => ({
      ...user.toObject(),
      email: maskEmail(user.email),
    }));

    return res.status(200).json({ users: maskedUsers });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({ message: 'Session expired. Please log in again' });
    }

    return res.status(500).json({ message: 'Internal server error. Please try again later' });
  }
});

module.exports = router;
