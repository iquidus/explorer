var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

var MasternodeStats = new Schema({
  timestamp: {
    type: Date,
    default: Date.now
  },
  symbol: {
    type: String,
    required: true
  },
  block_count_24h: {
    type: Number
  },
  block_avg_time: {
    type: Number
  },
  count_total: {
    type: Number
  },
  count_enabled: {
    type: Number
  },
  roi_days: {
    type: Number
  },
  reward_coins_24h: {
    type: Number
  },
  price_btc: {
    type: Number
  },
  price_usd: {
    type: Number
  }
});

module.exports = mongoose.model('masternode_stats', MasternodeStats);