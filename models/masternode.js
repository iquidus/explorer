var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

/*
 {
        "rank" : 1,
        "network" : "ipv4",
        "txhash" : "fee56a4dfe86cdf22ef69687f0affa1afb4c8c81dad36a6aaa5c6ae72c7b14cc",
        "outidx" : 0,
        "status" : "ENABLED",
        "addr" : "io49y5aa3sqQKSxQbZu5VcqUUZ8CitG6io",
        "version" : 70810,
        "lastseen" : 1532769342,
        "activetime" : 5430494,
        "lastpaid" : 1532763513
    },
*/

var MasternodeSchema = new Schema({
  
  rank: { type: Number, default: 0 },
  network: { type: String, default: "" },
  txhash: { type: String, default: "" },
  outidx : { type: Number, default: 0},
  status : { type: String, default: "" },
  addr: { type: String, unique: true, index: true},
  version : { type: Number, default: 0},
  lastseen: { type: Number, default: 0 },
  activetime: { type: Number, default: 0 },
  lastpaid: { type: Number, default: 0 }
}, {id: false});


module.exports = mongoose.model('Masternode', MasternodeSchema);

