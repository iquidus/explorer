var mintpal = require('../lib/mintpal')
  , bittrex = require('../lib/bittrex')
  , fs = require('fs')
  , settings = require('../lib/settings')
  , db = require('../lib/database')
  , mongoose = require('mongoose');

function exit() {
  mongoose.disconnect();
  process.exit(0);
}

function update_mintpal(cb) {
  if (settings.markets.mintpal == true) {
    db.check_market('mintpal', function(exists) {
      if (exists) {
        db.update_markets_db('mintpal', function(success) {
          if (success) {
            console.log('%s market data updated successfully.', 'mintpal');
            return cb();
          } else {
            console.log('error: updating market data: %s.', 'bittrex');
            return cb();
          }
        });
      } else {
        console.log('error: entry for %s does not exists in markets db.', 'mintpal');
        return cb();
      }
    });
  }
}

function update_bittrex(cb) {
  if (settings.markets.bittrex == true) {
    db.check_market('bittrex', function(exists) {
      if (exists) {
        db.update_markets_db('bittrex', function(success) {
          if (success) {
            console.log('%s market data updated successfully.', 'bittrex');
            return cb();
          } else {
            console.log('error: updating market data: %s.', 'bittrex');
            return cb();
          }
        });
      } else {
        console.log('error: entry for %s does not exists in markets db.', 'bittrex');
        return cb();
      }
    });
  }
}

var dbString = "mongodb://" + settings.dbsettings.address;
dbString = dbString + ":" + settings.dbsettings.port;
dbString = dbString + "/" + settings.dbsettings.database;

mongoose.connect(dbString, function(err) {
  if (err) {
    console.log('Unable to connect to database: %s', dbString);
    console.log('Aborting');
    exit();
  } else {
    update_mintpal(function(){
      update_bittrex(function(){
        exit();
      });
    });
  }
});