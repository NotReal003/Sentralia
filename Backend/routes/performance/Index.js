const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const PerfMetric = mongoose.model("PerfMetric", new mongoose.Schema({
  name: String,
  value: Number,
  delta: Number,
  id: String,
  timestamp: { type: Date, default: Date.now },
}));

router.post("/", async (req, res) => {
  try {
    const metric = new PerfMetric(req.body);
    await metric.save();
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const metrics = await PerfMetric.find().sort({ timestamp: -1 }).limit(100);
    res.json(metrics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
