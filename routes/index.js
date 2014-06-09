var express = require('express');
var router = express.Router();
var settings = require('../lib/settings');
var db = require('../lib/database');
var lib = require('../lib/explorer');
/* GET home page. */
router.get('/', function(req, res) {
  db.get_stats(settings.coin, function(stats){
  	res.render('index', { title: settings.title, active: 'home', stats: stats, symbol: settings.symbol });
  });
});

router.get('/info', function(req, res) {
  db.get_stats(settings.coin, function(stats){
  	res.render('info', { title: settings.title, active: 'info', settings: settings });
  });
});

router.get('/tx/:txid', function(req, res) {
  lib.get_rawtransaction(req.param('txid'), function (tx){
    if (tx != 'There was an error. Check your console.') {
      db.get_stats(settings.coin, function(stats){
        res.render('tx', { active: 'tx', tx: tx, stats: stats, symbol: settings.symbol });
      });
    } 
    else {
      db.get_stats(settings.coin, function(stats){
        res.render('index', { title: settings.title, active: 'home', stats: stats, symbol: settings.symbol });
      });
    }
  });
});

router.post('/tx', function(req, res) {
  var txid = req.body.submit;
  lib.get_rawtransaction(txid, function (tx){
    db.get_stats(settings.coin, function(stats){
      res.render('tx', { active: 'tx', tx: tx, stats: stats, symbol: settings.symbol });
    });
  });
});

router.get('/block/:hash', function(req, res) {
  lib.get_block(req.param('hash'), function (block) {
    db.get_stats(settings.coin, function(stats){
      res.render('block', { active: 'block', block: block, stats: stats, symbol: settings.symbol });
    });
  });
});

router.post('/search', function(req, res) {
  var query = req.body.search;
  if (query.length == 64) {
    lib.get_rawtransaction(query, function(tx) {
      db.get_stats(settings.coin, function(stats){
        if (tx != 'There was an error. Check your console.') {
          res.render('tx', { active: 'tx', tx: tx, stats: stats, symbol: settings.symbol });
        } else {
          lib.get_block(query, function(block) {
            if (block != 'There was an error. Check your console.') {
              res.render('block', { active: 'block', block: block, stats: stats, symbol: settings.symbol });
            } else {
              db.get_stats(settings.coin, function(stats){
                res.render('index', { 
                  title: settings.title, 
                  active: 'home', 
                  stats: stats, 
                  symbol: settings.symbol, 
                  error: "Search found no results."
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
            res.render('block', { active: 'block', block: block, stats: stats, symbol: settings.symbol });
          });
        });
      } else {
        db.get_stats(settings.coin, function(stats){
          res.render('index', { 
            title: settings.title, 
            active: 'home', 
            stats: stats, 
            symbol: settings.symbol, 
            error: "Search found no results."
          });
        });
      }
    });
  }
});

module.exports = router;

