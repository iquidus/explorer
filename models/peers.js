var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

var PeersSchema = new Schema({
  createdAt: { type: Date, expires: 86400, default: Date.now()},
  address: { type: String, default: "" },
  protocol: { type: String, default: "" },
  version: { type: String, default: "" },
  country: { type: String, default: "" }
});

module.exports = mongoose.model('Peers', PeersSchema);
