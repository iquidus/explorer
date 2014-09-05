var express = require('express')
  , router = express.Router()
  , settings = require('../lib/settings')
  , locale = require('../lib/locale')
  , db = require('../lib/database')
  , lib = require('../lib/explorer');

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
      console.log(block);
      db.get_txs(block, function(txs) {
        if (txs.length > 0) {
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
    } else {
      route_get_index(res, 'Block not found: ' + blockhash);
    }
  });
}
/* GET functions */

function route_get_tx(res, txid) {
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
              route_get_index(res);
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

function route_get_index(res, error) {
  db.get_stats(settings.coin, function(stats) {
    lib.get_blockhash(stats.count, function(hash) {
      lib.get_block(hash, function (block) {
        db.get_txs(block, function(txs) {
          res.render('index', { active: 'home', stats: stats, txs: txs, error: error});
        });
      });
    });
  });
}

/* GET home page. */
router.get('/', function(req, res) {
  route_get_index(res, null);
});

router.get('/info', function(req, res) {
  db.get_stats(settings.coin, function(stats){
  	res.render('info', { active: 'info', address: settings.address, hashes: settings.api });
  });
});

router.get('/bittrex', function(req, res) {
  if (settings.display.markets == true ) {   
    prepare_bittrex_data(function(bittrex_data) {
      var market_data = {
        coin: settings.markets.coin,
        exchange: settings.markets.exchange,
        bittrex: bittrex_data,
      };
      res.render('bittrex', { 
        active: 'markets', 
        marketdata: market_data, 
        market: 'bittrex'
      });
    });
  } else {
    route_get_index(res, null);
  }
});

router.get('/mintpal', function(req, res) {
  if (settings.display.markets == true ) {   
    prepare_mintpal_data(function(mintpal_data) {
      var market_data = {
        coin: settings.markets.coin,
        exchange: settings.markets.exchange,
        mintpal: mintpal_data,
      };
      res.render('mintpal', { 
        active: 'markets', 
        marketdata: market_data, 
        market: 'mintpal'
      });
    });
  } else {
    route_get_index(res, null);
  }
});

router.get('/tx/:txid', function(req, res) {
  route_get_tx(res, req.param('txid'));
});

router.get('/block/:hash', function(req, res) {
  route_get_block(res, req.param('hash'));
});

router.post('/search', function(req, res) {
  var query = req.body.search;
  if (query.length == 64) {
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

module.exports = router;

