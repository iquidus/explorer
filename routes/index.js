var express = require('express')
  , router = express.Router()
  , settings = require('../lib/settings')
  , locale = require('../lib/locale')
  , db = require('../lib/database')
  , lib = require('../lib/explorer')
  , qr = require('qr-image');

function prepare_mintpal_data(cb){
  if (settings.markets.mintpal == true) {
    db.get_market('mintpal', function(data) {
      var mintpal = {
        buys: data.buys,
        sells: data.sells,
        chartdata: JSON.stringify(data.chartdata),
        history: data.history,
        summary: data.summary,
      };
      return cb(mintpal);
    });
  } else {
    // required so js can reference mintpal.chartdata
    var nullobj = {
      chartdata: [],
    }
    return cb(nullobj);
  }  
}

function prepare_bittrex_data(cb){
  if (settings.markets.bittrex == true) {
    db.get_market('bittrex', function(data) {
      var bittrex = {
        history: data.history,
        buys: data.buys,
        sells: data.sells,
        summary: data.summary,
      };
      return cb(bittrex);
    });
  } else {
    return cb(null);
  }
}

function route_get_block(res, blockhash) {
  lib.get_block(blockhash, function (block) {
    if (block != 'There was an error. Check your console.') {
      if (blockhash == settings.genesis_block) {
        db.get_stats(settings.coin, function(stats) {
          res.render('block', { active: 'block', block: block, stats: stats, confirmations: settings.confirmations, txs: 'GENESIS'});
        });
      } else {
        //console.log(block);
        db.get_txs(block, function(txs) {
          if (txs.length > 0) {
            //console.log(txs);
            db.get_stats(settings.coin, function(stats) {
              res.render('block', { active: 'block', block: block, stats: stats, confirmations: settings.confirmations, txs: txs});
            });
          } else {
            db.create_txs(block, function(){
              db.get_txs(block, function(ntxs) {
                if (ntxs.length > 0) {
                  db.get_stats(settings.coin, function(stats) {
                    res.render('block', { active: 'block', block: block, stats: stats, confirmations: settings.confirmations, txs: ntxs});
                  });
                } else {
                  route_get_index(res, 'Block not found: ' + blockhash);
                }
              });
            });
          }
        });
      }
    } else {
      route_get_index(res, 'Block not found: ' + blockhash);
    }
  });
}
/* GET functions */

function route_get_tx(res, txid) {
  if (txid == settings.genesis_tx) {
    route_get_block(res, settings.genesis_block);
  } else {
    db.get_tx(txid, function(tx) {
      if (tx) {
        db.get_stats(settings.coin, function(stats){
          lib.get_blockcount(function(blockcount) {
            res.render('tx', { active: 'tx', tx: tx, stats: stats, confirmations: settings.confirmations, blockcount: blockcount});
          });
        });
      } 
      else {
        lib.get_rawtransaction(txid, function(rtx) {
          if (rtx.txid) {
            db.create_tx(txid, function(err) {
              if (err) {
                route_get_index(res, null);
              } else {
                db.get_tx(txid, function(newtx) {
                  db.get_stats(settings.coin, function(stats){
                    res.render('tx', { active: 'tx', tx: newtx, stats: stats, confirmations: settings.confirmations});
                  });
                });
              }
            });
          } else {
            route_get_index(res, null);
          }
        });  
      }
    });
  }
}

function route_get_index(res, error) {
  db.get_stats(settings.coin, function(stats) {
    //console.log(stats.difficulty);
    lib.get_blockhash(stats.count, function(hash) {
      lib.get_block(hash, function (block) {
        db.get_txs(block, function(txs) {
          if (txs.length > 0) {
            res.render('index', { active: 'home', stats: stats, block: block, txs: txs, error: error});
          } else {
            db.create_txs(block, function(){
              db.get_txs(block, function(ntxs) {
                if (ntxs.length > 0) {
                  db.get_stats(settings.coin, function(stats) {
                    res.render('index', { active: 'home', stats: stats, block: block, txs: ntxs, error: error});
                  });
                } else {
                  route_get_index(res, 'Block tx\'s not found');
                }
              });
            }); 
          }
        });
      });
    });
  });
}

function route_get_address(res, hash, count) {
  db.get_stats(settings.coin, function(stats) {
    db.get_address(hash, function(address) {
      if (address) {
        var txs = [];
        var hashes = address.txs.reverse();
        if (address.txs.length < count) {
          count = address.txs.length;
        }
        lib.syncLoop(count, function (loop) {
          var i = loop.iteration();
          db.get_tx(hashes[i], function(tx) {
            if (tx) {
              txs.push(tx);
              loop.next();
            } else {
              loop.next();
            }
          });
        }, function(){
          res.render('address', { active: 'address', stats: stats, address: address, txs: txs});
        });
        
      } else {
        route_get_index(res, hash + ' not found');
      }
    });
  });
}

/* GET home page. */
router.get('/', function(req, res) {
  route_get_index(res, null);
});

router.get('/info', function(req, res) {
  db.get_stats(settings.coin, function(stats){
  	res.render('info', { active: 'info', address: settings.address, hashes: settings.api,  stats: stats });
  });
});

router.get('/bittrex', function(req, res) {
  if (settings.display.markets == true ) {  
    db.get_stats(settings.coin, function (stats) {  
      prepare_bittrex_data(function(bittrex_data) {
        var market_data = {
          coin: settings.markets.coin,
          exchange: settings.markets.exchange,
          bittrex: bittrex_data,
        };
        res.render('bittrex', { 
          active: 'markets', 
          marketdata: market_data, 
          market: 'bittrex',
          stats: stats
        });
      });
    });
  } else {
    route_get_index(res, null);
  }
});

router.get('/mintpal', function(req, res) {
  if (settings.display.markets == true ) { 
    db.get_stats(settings.coin, function (stats) {  
      prepare_mintpal_data(function(mintpal_data) {
        var market_data = {
          coin: settings.markets.coin,
          exchange: settings.markets.exchange,
          mintpal: mintpal_data,
        };
        res.render('mintpal', { 
          active: 'markets', 
          marketdata: market_data, 
          market: 'mintpal',
          stats: stats
        });
      });
    });
  } else {
    route_get_index(res, null);
  }
});

router.get('/richlist', function(req, res) {
  if (settings.display.richlist == true ) {  
    db.get_stats(settings.coin, function (stats) { 
      db.get_richlist(settings.coin, function(richlist){
        //console.log(richlist);
        if (richlist) {
          db.get_distribution(richlist, stats, function(distribution) {
            console.log(distribution);
            res.render('richlist', { 
              active: 'richlist', 
              balance: richlist.balance, 
              received: richlist.received,
              stats: stats,
              dista: distribution.t_1_25,
              distb: distribution.t_26_50,
              distc: distribution.t_51_75,
              distd: distribution.t_76_100,
              diste: distribution.t_101plus,
            });
          });
        } else {
          route_get_index(res, null);
        }
      });
    });   
  } else {
    route_get_index(res, null);
  }
});

router.get('/reward', function(req, res){
  db.get_stats(settings.coin, function (stats) {
    console.log(stats);
    db.get_heavy(settings.coin, function (heavy) {
      //heavy = heavy;
      var votes = heavy.votes; 
      votes.sort(function (a,b) {
        if (a.count < b.count) {
          return -1;
        } else if (a.count > b.count) {
          return 1;
        } else {
         return 0;
        }
      });
          
      res.render('reward', { active: 'reward', stats: stats, heavy: heavy, votes: heavy.votes });
    });
  });
});

router.get('/tx/:txid', function(req, res) {
  route_get_tx(res, req.param('txid'));
});

router.get('/block/:hash', function(req, res) {
  route_get_block(res, req.param('hash'));
});

router.get('/address/:hash', function(req, res) {
  route_get_address(res, req.param('hash'), 5);
});

router.get('/address/:hash/:count', function(req, res) {
  route_get_address(res, req.param('hash'), req.param('count'));
});

router.post('/search', function(req, res) {
  var query = req.body.search;
  if (query.length == 64) {
    if (query == settings.genesis_tx) {
      route_get_block(res, settings.genesis_block);
    } else {
      db.get_tx(query, function(tx) {      
        if (tx) {
          db.get_stats(settings.coin, function(stats){
            res.render('tx', { active: 'tx', tx: tx, stats: stats, confirmations: settings.confirmations});
          });
        } else {
          lib.get_block(query, function(block) {
            if (block != 'There was an error. Check your console.') {
              route_get_block(res, query);
            } else {
              route_get_index(res, locale.ex_search_error + query );
            }
          });
        }
      });
    }
  } else {
    db.get_address(query, function(address) {
      if (address) {
        route_get_address(res, address.a_id, 5);
      } else {
        lib.get_blockhash(query, function(hash) {
          if (hash != 'There was an error. Check your console.') {
            route_get_block(res, hash);
          } else {
            route_get_index(res, locale.ex_search_error + query );
          }
        });
      }
    });
  }
});

router.get('/qr/:string', function(req, res) {
  if (req.param('string')) {
    var address = qr.image(req.param('string'), { 
      type: 'png', 
      size: 4, 
      margin: 1, 
      ec_level: 'M' 
    });
    res.type('png');
    address.pipe(res);
  }
});

module.exports = router;

