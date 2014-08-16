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

/* GET home page. */
router.get('/', function(req, res) {
  db.get_stats(settings.coin, function(stats){
  	res.render('index', { active: 'home', stats: stats });
  });
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
    db.get_stats(settings.coin, function(stats){
      res.render('index', { active: 'home', stats: stats });
    });
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
    db.get_stats(settings.coin, function(stats){
      res.render('index', { active: 'home', stats: stats });
    });
  }
});

router.get('/tx/:txid', function(req, res) {
  lib.get_rawtransaction(req.param('txid'), function (tx){
    if (tx != 'There was an error. Check your console.') {
      db.get_stats(settings.coin, function(stats){
        res.render('tx', { active: 'tx', tx: tx, stats: stats, confirmations: settings.confirmations});
      });
    } 
    else {
      db.get_stats(settings.coin, function(stats){
        res.render('index', { active: 'home', stats: stats});
      });
    }
  });
});

router.post('/tx', function(req, res) {
  var txid = req.body.submit;
  lib.get_rawtransaction(txid, function (tx){
    db.get_stats(settings.coin, function(stats){
      res.render('tx', { active: 'tx', tx: tx, stats: stats, confirmations: settings.confirmations});
    });
  });
});

router.get('/block/:hash', function(req, res) {
  lib.get_block(req.param('hash'), function (block) {
    db.get_stats(settings.coin, function(stats){
      res.render('block', { active: 'block', block: block, stats: stats, confirmations: settings.confirmations});
    });
  });
});

router.post('/search', function(req, res) {
  var query = req.body.search;
  if (query.length == 64) {
    lib.get_rawtransaction(query, function(tx) {
      db.get_stats(settings.coin, function(stats){
        if (tx != 'There was an error. Check your console.') {
          res.render('tx', { active: 'tx', tx: tx, stats: stats});
        } else {
          lib.get_block(query, function(block) {
            if (block != 'There was an error. Check your console.') {
              res.render('block', { active: 'block', block: block, stats: stats});
            } else {
              db.get_stats(settings.coin, function(stats){
                res.render('index', {  
                  active: 'home', 
                  stats: stats, 
                  error: locale.ex_search_error
                });
              });
            }
          });
        }
      });
    });
  } else {
    lib.get_blockhash(query, function(hash) {
      if (hash != 'There was an error. Check your console.') {
        lib.get_block(hash, function(block) {
          db.get_stats(settings.coin, function(stats){
            res.render('block', { active: 'block', block: block, stats: stats});
          });
        });
      } else {
        db.get_stats(settings.coin, function(stats){
          res.render('index', { 
            active: 'home', 
            stats: stats, 
            error: locale.ex_search_error
          });
        });
      }
    });
  }
});

module.exports = router;

