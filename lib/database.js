var mongoose = require('mongoose')
  , Stats = require('../models/stats')
  , lib = require('./explorer')
  , settings = require('./settings');

var txarray = [];

function update_txarray(txlist, count) {
  if ( count < txlist.length ) {
    if(txlist[count]) {
      lib.get_rawtransaction(txlist[count], function (tx) {
        txarray.push(tx);
        Stats.update({coin: settings.coin}, {transactions: txarray}, function() {
        });
      });
    }
    count = count + 1;
  } else {
    return;
  }
  update_txarray(txlist, count);
};

module.exports = {
  // initialize DB
  connect: function(database, cb) {
    mongoose.connect(database, function(err) {
      if (err) {
        console.log('Unable to connect to database: %s', database);
        console.log('Aborting');
        process.exit(1);

      }
      console.log('Successfully connected to MongoDB');
      return cb();
    });
  },

  check_stats: function(coin, cb) {
    Stats.findOne({coin: coin}, function(err, stats) {
      if(stats) {
        return cb(true);
      } else {
        return cb(false);
      }
    });
  },

  get_stats: function(coin, cb) {
    Stats.findOne({coin: coin}, function(err, stats) {
      if(stats) {
        return cb(stats);
      } else {
        return cb(null);
      }
    });
  },

  update_tx: function(cb) {
    Stats.findOne({coin: 'Heavycoin'}, function(err, stats) {
      if(stats) {
        txarray = [];
        update_txarray(stats.transactions, 0);
        return cb(true);
      } else {
        return cb(false);
      }
    });
  },

  create_stats: function(coin, cb) {
    var newStats = new Stats({
      coin: coin,
    });

    newStats.save(function(err) {
      if (err) {
        console.log(err);
        return cb();
      } else {
        console.log("initial stats entry created for %s", coin);
        console.log(newStats);
        return cb();
      }
    });
  },

  update_db: function(coin, cb) {
    lib.get_blockcount( function (count) {
      lib.get_hashrate( function (hashrate) {
        lib.get_difficulty( function (difficulty) {
          lib.get_blockhash(count, function (hash) {
            lib.get_block(hash, function (block) {
              if (block) {                   
                lib.get_connectioncount(function (connections) {
                  Stats.update({coin: coin}, { 
                    coin: coin,
                    count : count,
                    difficulty: Math.round(difficulty*100)/100,
                    hashrate: Math.round((hashrate / 1000 / 1000 / 1000)*100)/100,
                    timestamp: block.time,
                    size: Math.round((block.size / 1024)*100)/100,
                    transactions: block.tx,
                    tx_count: block.tx.length,
                    connections: connections,
                  }, function() {
                      Stats.findOne({coin: settings.coin}, function(err, stats) {
                        if(stats) {
                          txarray = [];
                          update_txarray(stats.transactions, 0);
                          return cb(true);
                        }
                      });
                    });
                  });
                
              } else {
                return cb(false);
              }
            });
          });
        });
      });
    });
  }
};