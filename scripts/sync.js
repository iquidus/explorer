var mongoose = require('mongoose')
  , db = require('../lib/database')
  , Tx = require('../models/tx')  
  , Address = require('../models/address') 
  , AddressTx = require('../models/addresstx') 
  , Richlist = require('../models/richlist')  
  , Stats = require('../models/stats')  
  , settings = require('../lib/settings')
  , fs = require('fs');

  
  const cluster = require('cluster');
  const numCPUs = require('os').cpus().length;

var mode = 'update';
var database = 'index';

// displays usage and exits
function usage() {
  console.log('Usage: node scripts/sync.js [database] [mode]');
  console.log('');
  console.log('database: (required)');
  console.log('index [mode] Main index: coin info/stats, transactions & addresses');
  console.log('market       Market data: summaries, orderbooks, trade history & chartdata')
  console.log('');
  console.log('mode: (required for index database only)');
  console.log('update       Updates index from last sync to current block');
  console.log('check        checks index for (and adds) any missing transactions/addresses');
  console.log('reindex      Clears index then resyncs from genesis to current block');
  console.log('');
  console.log('notes:');
  console.log('* \'current block\' is the latest created block when script is executed.');
  console.log('* The market database only supports (& defaults to) reindex mode.');
  console.log('* If check mode finds missing data(ignoring new data since last sync),');
  console.log('  index_timeout in settings.json is set too low.')
  console.log('');
  process.exit(0);
}

// check options
if (process.argv[2] == 'index') {
  if (process.argv.length <3) {
    usage();
  } else {
    switch(process.argv[3])
    {
    case 'update':
      mode = 'update';
      break;
    case 'check':
      mode = 'check';
      break;
    case 'reindex':
      mode = 'reindex';
      break;
    default:
      usage();
    }
  }
} else if (process.argv[2] == 'market'){
  database = 'market';
} else {
  usage();
}

function create_lock(cb) {
  if ( database == 'index' ) {
    var fname = './tmp/' + database + '.pid';
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

function remove_lock(cb) {
  if ( database == 'index' ) {
    var fname = './tmp/' + database + '.pid';
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

function is_locked(cb) {
  if ( database == 'index' ) {
    var fname = './tmp/' + database + '.pid';
    fs.exists(fname, function (exists){
      if(exists) {
        return cb(true);
      } else {
        return cb(false);
      }
    });
  } else {
    return cb();
  } 
}

function exit() {
  remove_lock(function(){
    mongoose.disconnect();
    process.exit(0);
  });
}

var dbString = 'mongodb://' + settings.dbsettings.user;
dbString = dbString + ':' + settings.dbsettings.password;
dbString = dbString + '@' + settings.dbsettings.address;
dbString = dbString + ':' + settings.dbsettings.port;
dbString = dbString + '/' + settings.dbsettings.database;

is_locked(function (exists) {
  if (exists && cluster.isMaster) {
    console.log("Script already running..");
    process.exit(0);
  } else {
    create_lock(function (){
      console.log("script launched with pid: " + process.pid);
      mongoose.connect(dbString, { useNewUrlParser: true }, function(err) {
        if (err) {
          console.log('Unable to connect to database: %s', dbString);
          console.log('Aborting');
          exit();
        } else if (database == 'index') {
          db.check_stats(settings.coin, function(exists) {
            if (exists == false) {
              console.log('Run \'npm start\' to create database structures before running this script.');
              exit();
            } else {
              if(cluster.isMaster){
                db.update_db(settings.coin, function(){
                numWorkers = 0;
                db.get_stats(settings.coin, function(stats){
                  if (settings.heavy == true) {
                    db.update_heavy(settings.coin, stats.count, 20, function(){
                    
                    });
                  }

                  if(mode == 'reindex'){
                    Address.deleteMany({}, function(err2, res1) { 
                      AddressTx.deleteMany({}, function(err3, res2){
                        Tx.deleteMany({}, function(err4, res3){
                          Richlist.updateOne({coin: settings.coin}, {
                            received: [],
                            balance: [],
                          }, function(err3) { 
                            Stats.updateOne({coin: settings.coin}, { 
                              last: 0,
                            }, function() {
                              console.log('index cleared (reindex)');
                            }); 
                          });
                        });
                      });
                    });
                  }
                  console.log('Each worker is going to get %s blocks to evaluate.', Math.round(stats.count/numCPUs));
                  //console.log(`Master ${process.pid} is running`);
                  // Fork workers.
                  for (let i = 0; i < numCPUs; i++) {
                      if(i == 0){
                      cluster.fork({start:1, end: (Math.round((stats.count/numCPUs)*(i+1))-1), wid:i})
                      numWorkers++;
                      }else if(i==numCPUs - 1){
                          cluster.fork({start:Math.round((stats.count/numCPUs)*i), end: (Math.round((stats.count/numCPUs)*(i+1))), wid:i})
                          numWorkers++;
                      }else{
                          cluster.fork({start:Math.round((stats.count/numCPUs)*i), end: (Math.round((stats.count/numCPUs)*(i+1))), wid:i})
                          numWorkers++;
                      }
                  }
          
                  for (const id in cluster.workers){
                      cluster.workers[id].on('message', function(msg){
                          console.log(`worker ${worker.process.pid} died`);
                          numWorkers = numWorkers - 1;
                          if(numWorkers == 0){
                            db.update_richlist('received', function(){
                              db.update_richlist('balance', function(){
                                db.get_stats(settings.coin, function(nstats){
                                  console.log('reindex complete (block: %s)', nstats.last);
                                  db.update_cronjob_run(settings.coin,{list_blockchain_update: Math.floor(new Date() / 1000)}, function(cb) {
                                    exit();
                                    });
                                });
                              });
                            });
                          }
                      });
                    }
                  });
                });
              }else{
                  console.log('Starting worker');
                  db.update_tx_db(settings.coin, Number(cluster.worker.process.env['start']), Number(cluster.worker.process.env['end']), settings.update_timeout, function(){
                    process.send({pid: cluster.worker.process.pid, wid: cluster.worker.process.pid, msg: 'done'});
                  });
              }
            }
          });
        } else {
          //update markets
          var markets = settings.markets.enabled;
          var complete = 0;
          for (var x = 0; x < markets.length; x++) {
            var market = markets[x];
            db.check_market(market, function(mkt, exists) {
              if (exists) {
                db.update_markets_db(mkt, function(err) {
                  if (!err) {
                    console.log('%s market data updated successfully.', mkt);
                    complete++;
                    if (complete == markets.length) {
                      db.update_cronjob_run(settings.coin,{list_market_update: Math.floor(new Date() / 1000)}, function(cb) {
                        exit();
                        });
                    }
                  } else {
                    console.log('%s: %s', mkt, err);
                    complete++;
                    if (complete == markets.length) {
                      db.update_cronjob_run(settings.coin,{list_market_update: Math.floor(new Date() / 1000)}, function(cb) {
                        exit();
                        });
                    }
                  }
                });
              } else {
                console.log('error: entry for %s does not exists in markets db.', mkt);
                complete++;
                if (complete == markets.length) {
                  exit();
                }
              }
            });
          }
        }
      });
    });
  }
});