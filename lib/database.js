var mongoose = require('mongoose')
  , Stats = require('../models/stats')
  , Markets = require('../models/markets')
  , lib = require('./explorer')
  , settings = require('./settings')
  , mintpal = require('./mintpal')
  , bittrex = require('./bittrex');

var txarray = [];
var processed = [];

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

function mintpal_get_buys(cb) {
  mintpal.get_orders(settings.markets.coin, settings.markets.exchange, 'BUY', function (error, orders){
    if (error) {
      return cb();  
    } else {
      if (orders.error == null && orders.type == 'BUY') {
        return cb(orders.orders);
      } 
    }
  });
};

function mintpal_get_sells(cb) {
  mintpal.get_orders(settings.markets.coin, settings.markets.exchange, 'SELL', function (error, orders){
    if (error) {
      return cb();
    } else {
      if (orders.error == null && orders.type == 'SELL') {
        return cb(orders.orders);
      } 
    }
  });
};

function mintpal_get_trades(cb) {
  mintpal.get_trades(settings.markets.coin, settings.markets.exchange, function (error, trades){
    if (error) {
      return cb();  
    } else {
      if (trades.error == null) {
        return cb(trades.trades);
      } 
    }
  });
};

function mintpal_get_stats(cb) {
  mintpal.get_stats(settings.markets.coin, settings.markets.exchange, function (error, stats){
    if (error) {
      return cb();  
    } else {
      if (stats.error == null) {
        return cb(stats);
      } 
    }
  });
};

function mintpal_get_chartdata(cb) {
  mintpal.get_chartdata(settings.markets.coin, settings.markets.exchange, '1DD', function (error, chartdata){
    if (error) {
      console.log(error);
      return cb();
    } else {
      if (chartdata.error == null) {
        processed = [];
        lib.syncLoop(chartdata.length, function (loop) {
          var i = loop.iteration();
          processed.push([chartdata[i].date, parseFloat(chartdata[i].open), parseFloat(chartdata[i].high), parseFloat(chartdata[i].low), parseFloat(chartdata[i].close)]);
          loop.next();
        }, function(){
          return cb(processed);
        });
      } 
    }
  });
};

function bittrex_get_summary(cb) {
  bittrex.get_summary(settings.markets.coin, settings.markets.exchange, function(err, result) {
    if (err) {
      console.log(err);
      return cb();
    } else {
      return cb(result);
    }
  });
}

function bittrex_get_history(cb) {
  bittrex.get_history(settings.markets.coin, settings.markets.exchange, function(err, result) {
    if (err) {
      console.log(err);
      return cb();
    } else {
      return cb(result);
    }
  });
}

function bittrex_get_orders(cb) {
  bittrex.get_orders(settings.markets.coin, settings.markets.exchange, function(err, orders) {
    var buys = [];
    var sells = [];
    lib.syncLoop(orders.buy.length, function (loop) {
      var i = loop.iteration();
      var order = {
        amount: parseFloat(orders.buy[i].Quantity),
        price: parseFloat(orders.buy[i].Rate),
        total: (parseFloat(orders.buy[i].Quantity) * parseFloat(orders.buy[i].Rate)).toFixed(8)
      }
      buys.push(order);
      loop.next();
      }, function(){
        lib.syncLoop(orders.sell.length, function (loop) {
          var i = loop.iteration();
          var order = {
            amount: parseFloat(orders.sell[i].Quantity),
            price: parseFloat(orders.sell[i].Rate),
            total: (parseFloat(orders.sell[i].Quantity) * parseFloat(orders.sell[i].Rate)).toFixed(8)
          }
          sells.push(order);
          loop.next();
          }, function(){
          return cb(buys,sells);
      });
    });
  });
}

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

  create_market: function(coin, exchange, market, cb) {
    var newMarkets = new Markets({
      market: market,
      coin: coin,
      exchange: exchange,
    });

    newMarkets.save(function(err) {
      if (err) {
        console.log(err);
        return cb();
      } else {
        console.log("initial markets entry created for %s", market);
        console.log(newMarkets);
        return cb();
      }
    });
  },
  
  check_market: function(market, cb) {
    Markets.findOne({market: market}, function(err, exists) {
      if(exists) {
        return cb(true);
      } else {
        return cb(false);
      }
    });
  },

  get_market: function(market, cb) {
    Markets.findOne({market: market}, function(err, data) {
      if(data) {
        return cb(data);
      } else {
        return cb(null);
      }
    });
  },

  update_markets_db: function(market, cb) {
    if(market == 'mintpal') {
      mintpal_get_chartdata(function(chartdata){
        mintpal_get_sells(function(sells){
          mintpal_get_buys(function(buys){
            mintpal_get_trades(function(trades){
              mintpal_get_stats(function(stats){
                if (buys && sells && chartdata && trades && stats) {
                  Markets.update({market:market}, {
                    chartdata: chartdata,
                    buys: buys,
                    sells: sells,
                    history: trades,
                    summary: stats,
                  }, function() {
                    return cb(true);
                  })
                }
              });
            });
          });
        });
      });
    } else if (market == 'bittrex') { 
      bittrex_get_history(function(history) {
        bittrex_get_summary(function(summary) {
          bittrex_get_orders(function(buys, sells) {
            if (history && summary && buys && sells) {
              Markets.update({market:market}, {
                history: history,
                summary: summary,
                buys: buys,
                sells: sells,

              }, function() {
                return cb(true);
              })
            }
          });
        });    
      });
    }
    else {
      console.log("unknown market: %s", market);
      return cb(false);
    }
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