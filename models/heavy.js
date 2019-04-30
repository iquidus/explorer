var mongoose = require('mongoose')
  , Schema = mongoose.Schema;
 
var HeavySchema = new Schema({
  coin: { type: String },
  lvote: { type: Number, default: 0 },
  reward: { type: Number, default: 0 },
  supply: { type: Number, default: 0 },
  cap: { type: Number, default: 0 },
  estnext: { type: Number, default: 0 },
  phase: { type: String, default:  'N/A'},
  maxvote: { type: Number, default: 0 },
  nextin: { type: String, default: 'N/A'},
  votes: { type: Array, default: [] },
});

module.exports = mongoose.model('Heavy', HeavySchema);

/*
votes : [{ count: 0, reward: 0, vote: 0}]
*/
