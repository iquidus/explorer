const mongoose = require('mongoose')
  , db = require('../lib/database')
  , Tx = require('../models/tx')  
  , Address = require('../models/address')  
  , settings = require('../lib/settings');

var COUNT = 5000; //number of blocks to index

function exit() {  
  mongoose.disconnect();
  process.exit(0);
}

mongoose.connect(settings.dbsettings.benchmark_uri, settings.dbsettings.benchmark_options)
  .then(() => {
    Tx.remove({}, function(err) { 
      Address.remove({}, function(err2) { 
        var s_timer = new Date().getTime();
        db.update_tx_db(settings.coin, 1, COUNT, settings.update_timeout, function(){
          var e_timer = new Date().getTime();
          Tx.count({}, function(txerr, txcount){
            Address.count({}, function(aerr, acount){
              var stats = {
                tx_count: txcount,
                address_count: acount,
                seconds: (e_timer - s_timer)/1000,
              };
              console.log(stats);
              exit();
            });
          });
        });
      });
    });
  }).catch(err => {
    console.log(`Unable to connect to database: ${settings.dbsettings.benchmark_uri}`);
    console.log(`With options: ${JSON.stringify(settings.dbsettings.benchmark_options, null, 2)}`);
    console.log('Aborting');
    exit();
  });