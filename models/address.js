var mongoose = require('mongoose')
  , Schema = mongoose.Schema;
 
var AddressSchema = new Schema({
  a_id: { type: String, unique: true},
  txs: { type: Array, default: [] },
  received: { type: Number, default: 0 },
  sent: { type: Number, default: 0 },
});

module.exports = mongoose.model('Address', AddressSchema);

