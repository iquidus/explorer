var express = require('express');
var router = express.Router();
var settings = require('../lib/settings');
var locale = require('../lib/locale');
var db = require('../lib/database');
var lib = require('../lib/explorer');
/* GET home page. */
router.get('/', function(req, res) {
  db.get_stats(settings.coin, function(stats){
  	res.render('index', { active: 'home', stats: stats });
  });
});

router.get('/info', function(req, res) {
  db.get_stats(settings.coin, function(stats){
  	res.render('info', { active: 'info', address: settings.address });
  });
});

router.get('/tx/:txid', function(req, res) {
  lib.get_rawtransaction(req.param('txid'), function (tx){
    if (tx != 'There was an error. Check your console.') {
      db.get_stats(settings.coin, function(stats){
        res.render('tx', { active: 'tx', tx: tx, stats: stats});
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
      res.render('tx', { active: 'tx', tx: tx, stats: stats});
    });
  });
});

router.get('/block/:hash', function(req, res) {
  lib.get_block(req.param('hash'), function (block) {
    db.get_stats(settings.coin, function(stats){
      res.render('block', { active: 'block', block: block, stats: stats});
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

