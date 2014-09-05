var mongoose = require('mongoose')
  , Stats = require('../models/stats')
  , Markets = require('../models/markets')
  , Tx = require('../models/tx')
  , lib = require('./explorer')
  , settings = require('./settings')
  , mintpal = require('./mintpal')
  , bittrex = require('./bittrex');

function is_unique(array, object, cb) {
  var unique = true;
  var index = null;
  lib.syncLoop(array.length, function (loop) {
    var i = loop.iteration();
    if (array[i].addresses == object) {
      unique = false;
      index = i;
    }
    loop.next();
  }, function(){
    return cb(unique, index);
  });
}

function prepare_vout(vout, cb) {
  var arr_vout = [];
  lib.syncLoop(vout.length, function (loop) {
    var i = loop.iteration();
    arr_vout.push({addresses: vout[i].scriptPubKey.addresses, amount: vout[i].value, index: vout[i].n});
    loop.next();
  }, function(){
    return cb(arr_vout);
  });
}

function get_input_addresses(input, cb) {
  var addresses = [];
  if (input.coinbase) {
    addresses.push({hash: 'BLOCK REWARD', amount: 0});
    return cb(addresses);
  } else {
    lib.get_rawtransaction(input.txid, function(tx){
      if (tx) {
        lib.syncLoop(tx.vout.length, function (loop) {
          var i = loop.iteration();
          if (tx.vout[i].n == input.vout) {
            addresses.push({hash: tx.vout[i].scriptPubKey.addresses[0], amount:tx.vout[i].value});  
            loop.next();
          } else {
            loop.next();
          } 
        }, function(){
          return cb(addresses);
        });
      } else {
        return cb();
      }
    });
  }
}

function prepare_vin(vin, cb) {
  var arr_vin = [];
  lib.syncLoop(vin.length, function (loop) {
    var i = loop.iteration();
    get_input_addresses(vin[i], function(addresses){
      if (addresses) {
          is_unique(arr_vin, addresses[0].hash, function(unique, index) {
            if (unique == true) {
              arr_vin.push({addresses:addresses[0].hash, amount:addresses[0].amount});
            } else {
              arr_vin[index].amount = parseFloat(arr_vin[index].amount) + parseFloat(addresses[0].amount);
            }
          }); 
        loop.next();
      } else {
        loop.next();
      }
    });
  }, function(){
    return cb(arr_vin);
  });
}

function calculate_total(vout, cb) {
  var total = 0;
  lib.syncLoop(vout.length, function (loop) {
    var i = loop.iteration();
    total = total + parseFloat(vout[i].amount);
    loop.next();
  }, function(){
    return cb(total);
  });
}

function find_tx(txid, cb) {
  Tx.findOne({txid: txid}, function(err, tx) {
    if(tx) {
      return cb(tx);
    } else {
      return cb(null);
    }
  });
}

function save_tx(txid, cb) {  
  lib.get_rawtransaction(txid, function(tx){
    if (tx) {
      lib.get_block(tx.blockhash, function(block){
        if (block) {
          prepare_vin(tx.vin, function(vin) {
            prepare_vout(tx.vout, function(vout) {
              calculate_total(vout, function(total){
                var newTx = new Tx({
                  txid: tx.txid,
                  vin: vin,
                  vout: vout,
                  total: total.toFixed(8),
                  timestamp: tx.time,
                  blockhash: tx.blockhash,
                  blockindex: block.height,
                });
                newTx.save(function(err) {
                  if (err) {
                    return cb(err);
                  } else {
                    //console.log(newTx);
                    return cb();
                  }
                });
              });
            });
          });  
        } else {
          return cb('block not found: ' + tx.blockhash);
        }
      });
    } 
  });
}

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
}

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
}

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
}

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
}

function mintpal_get_chartdata(cb) {
  mintpal.get_chartdata(settings.markets.coin, settings.markets.exchange, '1DD', function (error, chartdata){
    if (error) {
      console.log(error);
      return cb();
    } else {
      if (chartdata.error == null) {
        var processed = [];
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
}

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

  test_tx: function(txid, cb) {
    lib.get_rawtransaction(txid, function(tx){
      console.log('txid : %s', tx.txid);
      prepare_vin(tx.vin, function(vin) {
        console.log('------INPUT------')
        console.log(vin);
        prepare_vout(tx.vout, function(vout) {
          console.log('------OUTPUT------')
          console.log(vout);
          calculate_total(vout, function(total){
            console.log(total.toFixed(8));
          });
        });
      }); 
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

  get_tx: function(txid, cb) {
    find_tx(txid, function(tx){
      return cb(tx);
    });
  },

  get_txs: function(block, cb) {
    var txs = [];
    lib.syncLoop(block.tx.length, function (loop) {
      var i = loop.iteration();
      find_tx(block.tx[i], function(tx){
        if (tx) {
          txs.push(tx);
          loop.next();
        } else {
          loop.next();
        }
      })
    }, function(){
      return cb(txs);
    });
  },

  create_tx: function(txid, cb) {
    save_tx(txid, function(err){
      if (err) {
        return cb(err);
      } else {
        console.log('tx stored: %s', txid);
        return cb();
      }
    });
  },

  create_txs: function(block, cb) {
    lib.syncLoop(block.tx.length, function (loop) {
      var i = loop.iteration();
      save_tx(block.tx[i], function(err){
        if (err) {
          loop.next();
        } else {
          console.log('tx stored: %s', block.tx[i]);
          loop.next();
        }
      });
    }, function(){
      return cb();
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
                    return cb(true);
                      /*Stats.findOne({coin: settings.coin}, function(err, stats) {
                        if(stats) {
                          txarray = [];
                          update_txarray(stats.transactions, 0);
                          
                        }
                      });*/

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
  },

  update_tx_db: function(coin, start, end, timeout, cb) {
    var complete = false;
    lib.syncLoop((end - start) + 1, function (loop) {      
      var x = loop.iteration();
      lib.get_blockhash(start + x, function(blockhash){
        if (blockhash) {
          lib.get_block(blockhash, function(block) {
            if (block) {
              lib.syncLoop(block.tx.length, function (subloop) {
                var i = subloop.iteration();
                Tx.findOne({txid: block.tx[i]}, function(err, tx) {
                  if(tx) {
                    tx = null;
                    subloop.next();
                  } else {
                    save_tx(block.tx[i], function(err){
                      if (err) {
                        console.log(err);
                      } else {
                        console.log('%s: %s', block.height, block.tx[i]);
                      }
                      setTimeout( function(){
                        tx = null;
                        subloop.next();
                      }, timeout);
                    });
                  }
                });
              }, function(){
                //setTimeout(loop.next(), 500);
                blockhash = null;
                block = null;
                loop.next();
              });
            } else {
              console.log('block not found: %s', blockhash);
              loop.next();
            }
          });
        } else {
          loop.next();
        }
      });
    }, function(){
        Stats.update({coin: coin}, { 
          last: end,
        }, function() {
          return cb();
        });  
    });
  }
};