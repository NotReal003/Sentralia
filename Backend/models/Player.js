const mongoose = require("mongoose");

const playerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    xuid: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    avatar: {
      type: String
    },

    searchCount: {
      type: Number,
      default: 0
    },
    spamStrikes: { 
      type: Number,
      default: 0 
    },

    lastIncrementedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    strict: true
  }
);

playerSchema.index({ xuid: 1, lastIncrementedAt: 1 });

module.exports = mongoose.model("Player", playerSchema);
