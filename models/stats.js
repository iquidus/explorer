var mongoose = require('mongoose')
  , Schema = mongoose.Schema;
 
var StatsSchema = new Schema({
  coin: { type: String },
  count: { type: Number, default: 1 },
  last: { type: Number, default: 1 },
  difficulty: { type: String, default: 'N/A' },
  hashrate: { type: String, default: 'N/A' },
  timestamp: { type: Number, default: 0 },
  size: { type: Number, default: 0 },
//  transactions: { type: Array },
//  tx_count: { type: Number, default: 0 },
//  sent: { type: String, default: 'N/A' },
  connections: { type: Number, default: 0 },
});

module.exports = mongoose.model('Stats', StatsSchema);