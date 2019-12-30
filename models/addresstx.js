var mongoose = require('mongoose')
  , Schema = mongoose.Schema;
 
var AddressTXSchema = new Schema({
  a_id: { type: String, index: true},
  blockindex: {type: Number, default: 0, index: true},
  txid: { type: String, lowercase: true, index: true},
  // renamed to amount instead of balance for future changes
  amount: { type: Number, default: 0, index: true}
}, {id: false});

module.exports = mongoose.model('AddressTx', AddressTXSchema);
