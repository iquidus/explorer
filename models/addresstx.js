var mongoose = require('mongoose')
  , Schema = mongoose.Schema;
 
var AddressTXSchema = new Schema({
  a_id: { type: String, index: true},
  txid: { type: String, lowercase: true, index: true}
}, {id: false});

module.exports = mongoose.model('AddressTx', AddressTXSchema);
