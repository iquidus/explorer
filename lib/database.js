var mongoose = require('mongoose')
  , Stats = require('../models/stats')
  , Markets = require('../models/markets')
  , Address = require('../models/address')
  , AddressTx = require('../models/addresstx')
  , Tx = require('../models/tx')
  , Richlist = require('../models/richlist')
  , Peers = require('../models/peers')
  , Heavy = require('../models/heavy')
  , lib = require('./explorer')
  , settings = require('./settings')
  , fs = require('fs')
  , poloniex = require('./markets/poloniex')
  , bittrex = require('./markets/bittrex')
  , bleutrade = require('./markets/bleutrade')
  , cryptsy = require('./markets/cryptsy')
  , cryptopia = require('./markets/cryptopia')
  , yobit = require('./markets/yobit')
  , empoex = require('./markets/empoex')
  , ccex = require('./markets/ccex')
  , altmarkets = require('./markets/altmarkets')
  , crex = require('./markets/crex')
  , tradesatoshi = require('./markets/tradesatoshi');
//  , BTC38 = require('./markets/BTC38');

mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);
mongoose.set('useNewUrlParser', true);

function find_address(hash, cb) {
  Address.findOne({a_id: hash}, function(err, address) {
    if(address) {
      return cb(address);
    } else {
      return cb();
    }
  });
}

function find_address_tx(address, hash, cb) {
  AddressTx.findOne({a_id: address, txid: hash}, function(err, address_tx) {
    if(address_tx) {
      return cb(address_tx);
    } else {
      return cb();
    }
  });
}

function find_richlist(coin, cb) {
  Richlist.findOne({coin: coin}, function(err, richlist) {
    if(richlist) {
      return cb(richlist);
    } else {
      return cb();
    }
  });
}

function update_address(hash, txid, amount, type, cb) {
  // Check if address exists
  find_address(hash, function(address) {
    if (address) {
      // if coinbase (new coins PoW), update sent only and return cb.
      if ( hash == 'coinbase' ) {
        Address.updateOne({a_id:hash}, {
          sent: address.sent + amount,
		      balance: 0,
        }, function() {
          return cb();
        });
      } else {
          var received = address.received;
          var sent = address.sent;
          if (type == 'vin') {
            sent = sent + amount;
          } else {
            received = received + amount;
          }
          Address.updateOne({a_id:hash}, {
            received: received,
            sent: sent,
            balance: received - sent
          }, function() {
            // ensure tx doesnt already exist in address.txs
            find_address_tx(hash, txid, function(address_tx) {
              if (typeof address_tx == "undefined") {
                var newAddressTx = new AddressTx({
                  a_id: hash,
                  balance: received - sent,
                  txid: txid
                });
                newAddressTx.save(function(err) {
                  if (err) {
                    return cb(err);
                  } else {
                    return cb();
                  }
                });
              } else {
                AddressTx.updateOne({a_id: hash, txid: txid}, {
                  a_id: hash,
                  balance: received - sent,
                  txid: txid
                }, function() {
                  return cb();
                });
              }
            });
          });
        }
    } else {
      //new address
      if (type == 'vin') {
        var newAddress = new Address({
          a_id: hash,
          sent: amount,
          balance: amount,
        });
      } else {
        var newAddress = new Address({
          a_id: hash,
          received: amount,
          balance: amount,
        });
      }

      newAddress.save(function(err) {
        if (err) {
          return cb(err);
        } else {
          var newAddressTx = new AddressTx({
            a_id: hash,
            balance: amount,
            txid: txid
          });
          newAddressTx.save(function(err) {
            if (err) {
              return cb(err);
            } else {
              return cb();
            }
          });
        }
      });
    }
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
  //var s_timer = new Date().getTime();
  lib.get_rawtransaction(txid, function(tx){
    if (tx != 'There was an error. Check your console.') {
      lib.get_block(tx.blockhash, function(block){
        if (block) {
          lib.prepare_vin(tx, function(vin) {
            lib.prepare_vout(tx.vout, txid, vin, function(vout, nvin) {
              lib.syncLoop(vin.length, function (loop) {
                var i = loop.iteration();
                update_address(nvin[i].addresses, txid, nvin[i].amount, 'vin', function(){
                  loop.next();
                });
              }, function(){
                lib.syncLoop(vout.length, function (subloop) {
                  var t = subloop.iteration();
                  if (vout[t].addresses) {
                    update_address(vout[t].addresses, txid, vout[t].amount, 'vout', function(){
                      subloop.next();
                    });
                  } else {
                    subloop.next();
                  }
                }, function(){
                  lib.calculate_total(vout, function(total){
                    var newTx = new Tx({
                      txid: tx.txid,
                      vin: nvin,
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
                        //console.log('txid: ');
                        return cb();
                      }
                    });
                  });
                });
              });
            });
          });
        } else {
          return cb('block not found: ' + tx.blockhash);
        }
      });
    } else {
      return cb('tx not found: ' + txid);
    }
  });
}

function get_market_data(market, cb) {
  switch(market) {
    case 'altmarkets':
      altmarkets.get_data(settings.markets.coin, settings.markets.exchange, function(err, obj){
        return cb(err, obj);
      });
      break;
    case 'bittrex':
      bittrex.get_data(settings.markets.coin, settings.markets.exchange, function(err, obj){
        return cb(err, obj);
      });
      break;
    case 'bleutrade':
      bleutrade.get_data(settings.markets.coin, settings.markets.exchange, function(err, obj){
        return cb(err, obj);
      });
      break;
    case 'poloniex':
      poloniex.get_data(settings.markets.coin, settings.markets.exchange, function(err, obj){
        return cb(err, obj);
      });
      break;
    case 'cryptsy':
      cryptsy.get_data(settings.markets.coin, settings.markets.exchange, settings.markets.cryptsy_id, function(err, obj){
        return cb(err, obj);
      });
      break;
    case 'cryptopia':
      cryptopia.get_data(settings.markets.coin, settings.markets.exchange, settings.markets.cryptopia_id, function (err, obj) {
        return cb(err, obj);
      });
      break;
    case 'ccex':
      ccex.get_data(settings.markets.coin.toLowerCase(), settings.markets.exchange.toLowerCase(), settings.markets.ccex_key, function (err, obj) {
        return cb(err, obj);
      });
      break;
    case 'yobit':
      yobit.get_data(settings.markets.coin.toLowerCase(), settings.markets.exchange.toLowerCase(), function(err, obj){
        return cb(err, obj);
      });
      break;
    case 'empoex':
      empoex.get_data(settings.markets.coin, settings.markets.exchange, function(err, obj){
        return cb(err, obj);
      });
      break;
    case 'crex':
      crex.get_data(settings.markets.coin, settings.markets.exchange, function (err, obj){
        return cb(err, obj);
      });
      break;
    case 'tradesatoshi':
      tradesatoshi.get_data(settings.markets.coin, settings.markets.exchange, function (err, obj){
        return cb(err, obj);
      });
      break;
    default:
      return cb(null);
  }
}

function create_lock(lockfile, cb) {
  if (settings.lock_during_index == true) {
    var fname = './tmp/' + lockfile + '.pid';
    fs.appendFile(fname, process.pid, function (err) {
      if (err) {
        console.log("Error: unable to create %s", fname);
        process.exit(1);
      } else {
        return cb();
      }
    });
  } else {
    return cb();
  }
}

function remove_lock(lockfile, cb) {
  if (settings.lock_during_index == true) {
    var fname = './tmp/' + lockfile + '.pid';
    fs.unlink(fname, function (err){
      if(err) {
        console.log("unable to remove lock: %s", fname);
        process.exit(1);
      } else {
        return cb();
      }
    });
  } else {
    return cb();
  }
}

function is_locked(lockfile, cb) {
  if (settings.lock_during_index == true) {
    var fname = './tmp/' + lockfile + '.pid';
    fs.exists(fname, function (exists){
      if(exists) {
        return cb(true);
      } else {
        return cb(false);
      }
    });
  } else {
    return cb(false);
  }
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
      //console.log('Successfully connected to MongoDB');
      return cb();
    });
  },

  is_locked: function(cb) {
    is_locked("db_index", function (exists) {
      if (exists) {
        return cb(true);
      } else {
        return cb(false);
      }
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
        //console.log(newStats);
        return cb();
      }
    });
  },

  get_address: function(hash, cb) {
    find_address(hash, function(address){
      return cb(address);
    });
  },

  get_richlist: function(coin, cb) {
    find_richlist(coin, function(richlist){
      return cb(richlist);
    });
  },
  //property: 'received' or 'balance'
  update_richlist: function(list, cb){
    if(list == 'received') {
      Address.find({}, 'a_id balance received').sort({received: 'desc'}).limit(100).exec(function(err, addresses){
        Richlist.updateOne({coin: settings.coin}, {
          received: addresses,
        }, function() {
          return cb();
        });
      });
    } else { //balance
      Address.find({}, 'a_id balance received').sort({balance: 'desc'}).limit(100).exec(function(err, addresses){
        Richlist.updateOne({coin: settings.coin}, {
          balance: addresses,
        }, function() {
          return cb();
        });
      });
    }
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
    is_locked("db_index", function (exists) {
      if (exists) {
        console.log("db_index lock file exists...");
        return cb();
      } else {
        save_tx(txid, function(err){
          if (err) {
            return cb(err);
          } else {
            //console.log('tx stored: %s', txid);
            return cb();
          }
        });
      }
    });
  },

  create_txs: function(block, cb) {
    is_locked("db_index", function (exists) {
      if (exists) {
        console.log("db_index lock file exists...");
        return cb();
      } else {
        lib.syncLoop(block.tx.length, function (loop) {
          var i = loop.iteration();
          save_tx(block.tx[i], function(err){
            if (err) {
              loop.next();
            } else {
              //console.log('tx stored: %s', block.tx[i]);
              loop.next();
            }
          });
        }, function(){
          return cb();
        });
      }
    });
  },

  get_last_txs: function(count, min, cb) {
    Tx.find({'total': {$gt: min}}).sort({_id: 'desc'}).limit(count).exec(function(err, txs){
      if (err) {
        return cb(err);
      } else {
        return cb(txs);
      }
    });
  },

  get_last_txs_ajax: function(start, length, cb) {
      Tx.countDocuments({'total': {$gt: 1}}, function(err, count){
        Tx.find({'total': {$gt: 1}}).sort({blockindex: 'desc'}).skip(Number(start)).limit(Number(length)).exec(function(err, txs){
          if (err) {
            return cb(err);
          } else {
            return cb(txs, count);
          }
        });
    });
  },

  get_address_txs_ajax: function(hash, start, length, cb) {
    var totalCount = 0;
    Address.findOne({a_id: hash}, function(err, addressTotalTxs) {

      if(err) {
        return cb(err);
      } else {
        AddressTx.find({a_id: hash}).count({}, function(err, count){
          if(err) {
            return cb(err);
          } else {
            totalCount = count;
            AddressTx.find({a_id: hash}).sort({_id: 'desc'}).skip(Number(start)).limit(Number(length)).exec(function (err, address) {
              if (err) {
                return cb(err);
              } else {
                var txs = [];
                var count = address.length;
                var hashes = address;

                var txs = [];

                lib.syncLoop(count, function (loop) {
                  var i = loop.iteration();
                  find_tx(hashes[i].txid, function (tx) {
                    if (tx && !txs.includes(tx)) {
                      // tx = {...hashes[i], ...tx}
                      tx.balance = hashes[i].balance;
                      txs.push(tx);
                      loop.next();
                    } else if (!txs.includes(tx)) {
                      // tx = {...hashes[i], ...tx}
                      tx.balance = hashes[i].balance;
                      txs.push("1. Not found");
                      loop.next();
                    } else {
                      loop.next();
                    }
                  })
                }, function () {
                  return cb(txs, totalCount);
                });
              }
            });
          }
        });

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
        //console.log(newMarkets);
        return cb();
      }
    });
  },

  // checks market data exists for given market
  check_market: function(market, cb) {
    Markets.findOne({market: market}, function(err, exists) {
      if(exists) {
        return cb(market, true);
      } else {
        return cb(market, false);
      }
    });
  },

  // gets market data for given market
  get_market: function(market, cb) {
    Markets.findOne({market: market}, function(err, data) {
      if(data) {
        return cb(data);
      } else {
        return cb(null);
      }
    });
  },

  // creates initial richlist entry in database; called on first launch of explorer
  create_richlist: function(coin, cb) {
    var newRichlist = new Richlist({
      coin: coin,
    });
    newRichlist.save(function(err) {
      if (err) {
        console.log(err);
        return cb();
      } else {
        console.log("initial richlist entry created for %s", coin);
        //console.log(newRichlist);
        return cb();
      }
    });
  },

  // drops richlist data for given coin
  delete_richlist: function(coin, cb) {
    Richlist.findOneAndRemove({coin: coin}, function(err, exists) {
      if(exists) {
        return cb(true);
      } else {
        return cb(false);
      }
    });
  },
  // checks richlist data exists for given coin
  check_richlist: function(coin, cb) {
    Richlist.findOne({coin: coin}, function(err, exists) {
      if(exists) {
        return cb(true);
      } else {
        return cb(false);
      }
    });
  },

  create_heavy: function(coin, cb) {
    var newHeavy = new Heavy({
      coin: coin,
    });
    newHeavy.save(function(err) {
      if (err) {
        console.log(err);
        return cb();
      } else {
        console.log("initial heavy entry created for %s", coin);
        console.log(newHeavy);
        return cb();
      }
    });
  },

  check_heavy: function(coin, cb) {
    Heavy.findOne({coin: coin}, function(err, exists) {
      if(exists) {
        return cb(true);
      } else {
        return cb(false);
      }
    });
  },

  get_heavy: function(coin, cb) {
    Heavy.findOne({coin: coin}, function(err, heavy) {
      if(heavy) {
        return cb(heavy);
      } else {
        return cb(null);
      }
    });
  },
  get_distribution: function(richlist, stats, cb){
    var distribution = {
      supply: stats.supply,
      t_1_25: {percent: 0, total: 0 },
      t_26_50: {percent: 0, total: 0 },
      t_51_75: {percent: 0, total: 0 },
      t_76_100: {percent: 0, total: 0 },
      t_101plus: {percent: 0, total: 0 }
    };
    lib.syncLoop(richlist.balance.length, function (loop) {
      var i = loop.iteration();
      var count = i + 1;
      var percentage = ((richlist.balance[i].balance / 100000000) / stats.supply) * 100;
      if (count <= 25 ) {
        distribution.t_1_25.percent = distribution.t_1_25.percent + percentage;
        distribution.t_1_25.total = distribution.t_1_25.total + (richlist.balance[i].balance / 100000000);
      }
      if (count <= 50 && count > 25) {
        distribution.t_26_50.percent = distribution.t_26_50.percent + percentage;
        distribution.t_26_50.total = distribution.t_26_50.total + (richlist.balance[i].balance / 100000000);
      }
      if (count <= 75 && count > 50) {
        distribution.t_51_75.percent = distribution.t_51_75.percent + percentage;
        distribution.t_51_75.total = distribution.t_51_75.total + (richlist.balance[i].balance / 100000000);
      }
      if (count <= 100 && count > 75) {
        distribution.t_76_100.percent = distribution.t_76_100.percent + percentage;
        distribution.t_76_100.total = distribution.t_76_100.total + (richlist.balance[i].balance / 100000000);
      }
      loop.next();
    }, function(){
      distribution.t_101plus.percent = parseFloat(100 - distribution.t_76_100.percent - distribution.t_51_75.percent - distribution.t_26_50.percent - distribution.t_1_25.percent).toFixed(2);
      distribution.t_101plus.total = parseFloat(distribution.supply - distribution.t_76_100.total - distribution.t_51_75.total - distribution.t_26_50.total - distribution.t_1_25.total).toFixed(8);
      distribution.t_1_25.percent = parseFloat(distribution.t_1_25.percent).toFixed(2);
      distribution.t_1_25.total = parseFloat(distribution.t_1_25.total).toFixed(8);
      distribution.t_26_50.percent = parseFloat(distribution.t_26_50.percent).toFixed(2);
      distribution.t_26_50.total = parseFloat(distribution.t_26_50.total).toFixed(8);
      distribution.t_51_75.percent = parseFloat(distribution.t_51_75.percent).toFixed(2);
      distribution.t_51_75.total = parseFloat(distribution.t_51_75.total).toFixed(8);
      distribution.t_76_100.percent = parseFloat(distribution.t_76_100.percent).toFixed(2);
      distribution.t_76_100.total = parseFloat(distribution.t_76_100.total).toFixed(8);
      return cb(distribution);
    });
  },
  // updates heavy stats for coin
  // height: current block height, count: amount of votes to store
  update_heavy: function(coin, height, count, cb) {
    var newVotes = [];
    lib.get_maxmoney( function (maxmoney) {
      lib.get_maxvote( function (maxvote) {
        lib.get_vote( function (vote) {
          lib.get_phase( function (phase) {
            lib.get_reward( function (reward) {
              lib.get_supply( function (supply) {
                lib.get_estnext( function (estnext) {
                  lib.get_nextin( function (nextin) {
                    lib.syncLoop(count, function (loop) {
                      var i = loop.iteration();
                      lib.get_blockhash(height-i, function (hash) {
                        lib.get_block(hash, function (block) {
                          newVotes.push({count:height-i,reward:block.reward,vote:block.vote});
                          loop.next();
                        });
                      });
                    }, function(){
                      console.log(newVotes);
                      Heavy.updateOne({coin: coin}, {
                        lvote: vote,
                        reward: reward,
                        supply: supply,
                        cap: maxmoney,
                        estnext: estnext,
                        phase: phase,
                        maxvote: maxvote,
                        nextin: nextin,
                        votes: newVotes,
                      }, function() {
                        //console.log('address updated: %s', hash);
                        return cb();
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  },

  // updates market data for given market; called by sync.js
  update_markets_db: function(market, cb) {
    get_market_data(market, function (err, obj) {
      if (err == null) {
        Markets.updateOne({market:market}, {
          chartdata: JSON.stringify(obj.chartdata),
          buys: obj.buys,
          sells: obj.sells,
          history: obj.trades,
          summary: obj.stats,
        }, function() {
          if ( market == settings.markets.default ) {
            Stats.updateOne({coin:settings.coin}, {
              last_price: obj.stats.last,
            }, function(){
              return cb(null);
            });
          } else {
            return cb(null);
          }
        });
      } else {
        return cb(err);
      }
    });
  },

  // updates stats data for given coin; called by sync.js
  update_db: function(coin, cb) {
    lib.get_blockcount( function (count) {
      if (!count){
        console.log('Unable to connect to explorer API');
        return cb(false);
      }
      lib.get_supply( function (supply){
        lib.get_connectioncount(function (connections) {
          Stats.updateOne({coin: coin}, {
            coin: coin,
            count : count,
            supply: supply,
            connections: connections,
          }, function() {
            return cb(true);
          });
        });
      });
    });
  },

  // updates tx, address & richlist db's; called by sync.js
  update_tx_db: function(coin, start, end, timeout, cb) {
    is_locked("db_index", function (exists) {
      if (exists) {
        console.log("db_index lock file exists...");
        return cb();
      } else {
        create_lock("db_index", function (){
          var complete = false;
          lib.syncLoop((end - start) + 1, function (loop) {
            var x = loop.iteration();
            if (x % 5000 === 0) {
              Tx.find({}).where('blockindex').lt(start + x).sort({timestamp: 'desc'}).limit(settings.index.last_txs).exec(function(err, txs){
                Stats.updateOne({coin: coin}, {
                  last: start + x - 1,
                  last_txs: '' //not used anymore left to clear out existing objects
                }, function() {});
              });
            }
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
            Tx.find({}).sort({timestamp: 'desc'}).limit(settings.index.last_txs).exec(function(err, txs){
              Stats.update({coin: coin}, {
                last: end,
                last_txs: '' //not used anymore left to clear out existing objects
              }, function() {
                remove_lock("db_index", function(){
                  return cb();
                });
              });
            });
          });
        });
      }
    });
  },

  create_peer: function(params, cb) {
    var newPeer = new Peers(params);
    newPeer.save(function(err) {
      if (err) {
        console.log(err);
        return cb();
      } else {
        return cb();
      }
    });
  },

  find_peer: function(address, cb) {
    Peers.findOne({address: address}, function(err, peer) {
      if (err) {
        return cb(null);
      } else {
        if (peer) {
         return cb(peer);
       } else {
         return cb (null)
       }
      }
    })
  },

  get_peers: function(cb) {
    Peers.find({}, function(err, peers) {
      if (err) {
        return cb([]);
      } else {
        return cb(peers);
      }
    });
  }
};
