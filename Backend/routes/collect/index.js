const express = require('express');
const router = express.Router();
const Count = require('../../models/Count');
const Player = require('../../models/Player');
const geoip = require('geoip-lite');
const UAParser = require('ua-parser-js');
const crypto = require('crypto');
const axios = require('axios');

const allowedPageTypes = ['demo', 'linkclicked', 'request', 'product', 'support', 'pay', 'social', 'stream'];

router.patch("/players", async (req, res) => {
  let data = req.body;

  if (data?.body && typeof data.body === "string") {
    try {
      data = JSON.parse(data.body);
    } catch (err) {
      return res.status(400).json({ error: "Invalid JSON", message: "Request body must be valid JSON" });
    }
  }

  const playerId = data?.xuid;

  if (!playerId) {
    return res.status(400).json({ error: "Missing xuid", message: "Player xuid is required" });
  }

  try {
    let playerRecord = await Player.findOne({ xuid: playerId });
    let spamStrikes = playerRecord?.spamStrikes || 0;

    let COUNT_COOLDOWN_SECONDS = 20; // 20s
    if (spamStrikes >= 50) {
      return res.status(406).json({ error: "Blocked", message: "This player is blocked. visit notreal003.org/d and contact us." });
    } else if (spamStrikes >= 30) {
      COUNT_COOLDOWN_SECONDS = 300; // 5 mins
    } else if (spamStrikes >= 15) {
      COUNT_COOLDOWN_SECONDS = 120; // 2 mins
    } else if (spamStrikes >= 5) {
      COUNT_COOLDOWN_SECONDS = 60; // 1 min
    }

    if (["2535460r9393912090366", "NotFound"].includes(playerId)) {
      return res.status(406).json({ error: "Bad Player", message: "Not Allowed" });
    }

    const now = new Date();

    if (playerRecord && playerRecord.lastIncrementedAt) {
      const timeSinceLastIncr = (now.getTime() - playerRecord.lastIncrementedAt.getTime()) / 1000;

      if (timeSinceLastIncr < COUNT_COOLDOWN_SECONDS) {
        const updatedPlayer = await Player.findOneAndUpdate(
          { xuid: playerId },
          { $inc: { spamStrikes: 1 }, $set: { updatedAt: now } },
          { new: true }
        );

        return res.status(429).json({
          message: "Cooldown active — count not increased",
          player: updatedPlayer,
          cooldown_active: true,
          seconds: COUNT_COOLDOWN_SECONDS,
          strikes: updatedPlayer.spamStrikes //
        });
      }
    }

    let apiData;
    if (playerId !== "2535429037686544") {
      const response = await axios.get(`https://api.ngmc.co/v1/players/${playerId}`, { timeout: 25000 });
      apiData = response.data;
    } else {
      const response = await axios.get(`https://api.ngmc.co/v1/players/notreal003`, { timeout: 25000 });
      apiData = response.data;
    }

    if (!apiData.xuid) {
      return res.status(404).json({ error: "Player not found in response" });
    }

    const { xuid, name, avatar } = apiData;

    const newStrikes = Math.max(0, spamStrikes - 1); 

    const finalPlayer = await Player.findOneAndUpdate(
      { xuid },
      {
        $set: {
          name,
          avatar,
          updatedAt: now,
          lastIncrementedAt: now,
          spamStrikes: newStrikes
        },
        $inc: { searchCount: 1 }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
      message: "Player log updated (+1 count)",
      player: finalPlayer,
      cooldown_active: false
    });

    setTimeout(() => {
      axios.post(
        "https://discord.com/api/webhooks/....",
        { content: `🔍 Player looked up: **${name}** (API)` }
      ).catch(err => {
        console.error("Webhook failed:", err.message);
      });
    }, 10000);

  } catch (error) {
    const isTimeout = error.code === 'ECONNABORTED' || (error.message && error.message.includes('timeout'));

    if (!isTimeout) console.error(error);

    if (error.response?.status === 404) {
      return res.status(404).json({ error: "404: Not Found", message: "Player not found on NetherGames Network" });
    }
    
    if (isTimeout) {
      return res.status(504).json({ error: "Gateway Timeout", message: "The NetherGames API took too long to respond." });
    }

    res.status(500).json({ error: "Server error", details: error.message });
  }
});

router.get("/players", async (req, res) => {
  try {
    const players = await Player.find().sort({ searchCount: -1 }); // sort by most searched
    res.json(players);
  } catch (error) {
    res.status(500).json({ error: "Server error", details: error.message });
  }
});
router.get('/:pageType', async (req, res, next) => {
  const { pageType } = req.params;

  if (!allowedPageTypes.includes(pageType)) {
    return res.status(400).json({
      success: false,
      message: `"pageType" must be one of the following: ${allowedPageTypes.join(', ')}`,
    });
  }

  const today = new Date().toISOString().split('T')[0]; // Get today's date (YYYY-MM-DD)
  const startOfWeek = new Date(); // Get the start of the current week
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Sunday
  const weekKey = startOfWeek.toISOString().split('T')[0];

  const monthKey = today.slice(0, 7); // YYYY-MM

  try {
    let countRecord = await Count.findOne({ pageType });

    if (!countRecord) {
      countRecord = new Count({
        pageType,
        totalVisits: 0,
        dailyVisits: {},
        weeklyVisits: {},
        monthlyVisits: {},
      });
    }

    countRecord.totalVisits += 1;

    countRecord.dailyVisits.set(today, (countRecord.dailyVisits.get(today) || 0) + 1);

    countRecord.weeklyVisits.set(weekKey, (countRecord.weeklyVisits.get(weekKey) || 0) + 1);

    countRecord.monthlyVisits.set(monthKey, (countRecord.monthlyVisits.get(monthKey) || 0) + 1);

    await countRecord.save();

    res.status(200).json({ success: true, message: 'Visit tracked successfully.' });
  } catch (error) {
    console.error('Error tracking visit:', error);
    next(error);
    res.status(500).json({ success: false, message: 'Error tracking visit.' });
  }
});

router.get('/request/producthunt', async (req, res) => {
  const pageType = 'producthunt';

  const today = new Date().toISOString().split('T')[0]; // Get today's date (YYYY-MM-DD)
  const startOfWeek = new Date(); // Get the start of the current week
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Sunday
  const weekKey = startOfWeek.toISOString().split('T')[0];

  const monthKey = today.slice(0, 7); // YYYY-MM

  try {
    let countRecord = await Count.findOne({ pageType });

    if (!countRecord) {
      countRecord = new Count({
        pageType,
        totalVisits: 0,
        dailyVisits: {},
        weeklyVisits: {},
        monthlyVisits: {},
      });
    }

    countRecord.totalVisits += 1;

    countRecord.dailyVisits.set(today, (countRecord.dailyVisits.get(today) || 0) + 1);

    countRecord.weeklyVisits.set(weekKey, (countRecord.weeklyVisits.get(weekKey) || 0) + 1);

    countRecord.monthlyVisits.set(monthKey, (countRecord.monthlyVisits.get(monthKey) || 0) + 1);

    await countRecord.save();

    res.status(200).json({ success: true, message: 'Visit tracked successfully. (productHunt)' });
  } catch (error) {
    console.error('Error tracking visit:', error);
    res.status(500).json({ success: false, message: 'Error tracking visit.' });
  }
});

module.exports = router;
