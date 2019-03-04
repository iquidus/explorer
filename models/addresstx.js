var mongoose = require('mongoose')
  , Schema = mongoose.Schema;
 
var AddressTXSchema = new Schema({
  a_id: { type: String, index: true},
  addresses: { type: String, lowercase: true},
  type: { type: String }
}, {id: false});

module.exports = mongoose.model('AddressTx', AddressTXSchema);
