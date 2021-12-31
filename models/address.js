var mongoose = require('mongoose')
  , Schema = mongoose.Schema;
 
var AddressSchema = new Schema({
  a_id: { type: String, unique: true, index: true},
  name: { type: String, default: '', index: true},
  received: { type: Number, default: 0, index: true },
  sent: { type: Number, default: 0, index: true },
  balance: {type: Number, default: 0, index: true},
}, {id: false});

module.exports = mongoose.model('Address', AddressSchema);

