const mongoose = require('mongoose');


const AnalyticsEventSchema = new mongoose.Schema({
  eventType: { 
    type: String, 
    required: true, 
    index: true // Indexed for fast filtering by page type
  },
  
  timestamp: { 
    type: Date, 
    default: Date.now, 
    index: true // Critical for time-range queries (e.g., "Last 7 days")
  },

  visitorId: {
    type: String,
    required: true,
    index: true
  },
  isNewSession: {
    type: Boolean,
    default: false
  },

  meta: {
    browser: String,      // e.g., "Chrome", "Firefox"
    os: String,          // e.g., "Windows 10", "iOS"
    device: String,      // e.g., "Mobile", "Tablet", "Desktop"
    referrer: String,    // Where did they come from?
  },

  attribution: {
    source: String,   // utm_source
    medium: String,   // utm_medium
    campaign: String  // utm_campaign
  },

  geo: {
    country: String,
    region: String,
    city: String,
    ll: [Number] // Latitude/Longitude for map plotting
  }
}, { 
  timestamps: true, // Adds createdAt and updatedAt automatically
  expireAfterSeconds: 31536000 // Optional: TTL index to auto-delete records after 1 year to manage DB size
});

AnalyticsEventSchema.index({ eventType: 1, timestamp: -1 });

module.exports = mongoose.model('AnalyticsEvent', AnalyticsEventSchema);

