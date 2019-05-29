var mongoose = require('mongoose'),
    db = require('../lib/database'),
    Tx = require('../models/tx'),
    Address = require('../models/address'),
    AddressTx = require('../models/addresstx'),
    Richlist = require('../models/richlist'),
    Stats = require('../models/stats'),
    settings = require('../lib/settings'),
    lib = require('../lib/explorer'),
    fs = require('fs'),
    log4js = require('log4js');

var MaxPerWorker = settings.cluster.maxPerWorker;
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

var mode = 'update';
var database = 'index';

log4js.configure({
    appenders:{ 
      everything: { type: 'file', filename: 'logs/sync.log', maxLogSize: 10485760, backups: 10, compress: true }, 
      workerLog: { type: 'multiFile', base: 'logs/', property: 'categoryName',maxLogSize: 10485760, backups: 10, compress: true, extension: '.log' }, 
      console: { type: 'console' }  
      },
  
    categories:{
      default: { appenders: ['console','everything'], level: 'info'},
      OnlyShow: { appenders: ['console'], level: 'trace'},
      Workers: { appenders: ['console','workerLog'], level: 'debug'}            
      },
    disableClustering: true
  });
  const logger = log4js.getLogger();
  const onlyConsole = log4js.getLogger('OnlyShow');     
  const workerLog = log4js.getLogger('Workers.' + (cluster.isWorker? 'Worker-': 'Master-') + process.pid);    
  

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
    if (process.argv.length < 3) {
        usage();
    } else {
        switch (process.argv[3]) {
            case 'update':
                mode = 'update';
                break;
            case 'check':
                mode = 'check';
                break;
            case 'reindex':
                mode = 'reindex';
                break;
            case 'countMissing':
                mode = 'countMissing';
                break;
            default:
                usage();
        }
    }
} else if (process.argv[2] == 'market') {
    database = 'market';
} else {
    usage();
}

function create_lock(cb) {
    if(cluster.isMaster){
        if (database == 'index') {
            var fname = './tmp/' + database + '.pid';
            fs.appendFile(fname, process.pid, function(err) {
                if (err) {
                    logger.error("Error: unable to create %s", fname);
                    process.exit(1);
                } else {
                    return cb();
                }
            });
        } else {
            return cb();
        }
    }else{
        return cb();
    }
}

function remove_lock(cb) {
    if (database == 'index') {
        var fname = './tmp/' + database + '.pid';
        fs.unlink(fname, function(err) {
            if (err) {
                logger.error("unable to remove lock: %s", fname);
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
    if (database == 'index') {
        var fname = './tmp/' + database + '.pid';
        fs.exists(fname, function(exists) {
            if (exists) {
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
    remove_lock(function() {
        mongoose.disconnect();
        process.exit(0);
    });
}

//https://stackoverflow.com/questions/6312993/javascript-seconds-to-time-string-with-format-hhmmss
String.prototype.toHHMMSS = function() {
    var sec_num = parseInt(this, 10); // don't forget the second param
    var hours = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours < 10) {
        hours = "0" + hours;
    }
    if (minutes < 10) {
        minutes = "0" + minutes;
    }
    if (seconds < 10) {
        seconds = "0" + seconds;
    }
    return hours + ':' + minutes + ':' + seconds;
}

function clusterStart(stats, params) {
    var BlocksToGet = (mode == "check"? params.missing.length : Math.round(stats.count - stats.last));
    var numThreads = numCPUs;
    if (BlocksToGet > 0) {
        if (BlocksToGet < MaxPerWorker) {
            if (BlocksToGet < numThreads) {
                numThreads = BlocksToGet;
                numWorkersNeeded = BlocksToGet;
                MaxPerWorker = 1;
            } else {
                numWorkersNeeded = numThreads;
                MaxPerWorker = Math.round(BlocksToGet / numWorkersNeeded);
            }
        } else {
            numWorkersNeeded = Math.round(BlocksToGet / MaxPerWorker);
        }
        logger.info("Workers needed: %s. NumThreads: %s. BlocksToGet %s. Per Worker: %s", numWorkersNeeded, numThreads, BlocksToGet, MaxPerWorker, stats.count, stats.last);
        //exit();
        // Fork workers.;
        for (let i = 0; i < numThreads; i++) {
            var end = Math.round(params.startAtBlock + MaxPerWorker) - 1;
            if (end > stats.count) {
                end = stats.count;
			}
			var work = [];
			if(mode == "check"){
				for (let wt = startAtBlock; wt <= end; wt++) {
					work.push(missing[wt]);
				}
            }
            cluster.fork({
                start: params.startAtBlock,
                end: end,
				wid: i,
				func: mode,
				workload: work
			})
			numWorkersNeeded = (numWorkersNeeded > 1 ? numWorkersNeeded - 1 : 0);
            numWorkers++;
            params.startAtBlock += Math.round(MaxPerWorker);
            params.highestBlock = end;
        }
		logger.info("There are %s workers", Object.keys(cluster.workers).length);

        cluster.on('message', function(worker, msg) {
            if (msg.msg == "done") {
				//worker.disconnect();
				worker.kill();
				workerLog.info(`worker ${msg.pid} died`);
				workerLog.info("There are still %s workers", Object.keys(cluster.workers).length);
                if (Object.keys(cluster.workers).length < 1) {
                    var e_timer = new Date().getTime();
                    logger.info("Updating Richlist - Recieved");
                    db.update_richlist('received', function() {
                        logger.info("Updating Richlist - Balance");
                        db.update_richlist('balance', function() {
                            logger.info("Getting Stats");
                            db.get_stats(settings.coin, function(nstats) {
                                logger.info("Updating CronJob_Run");
                                db.update_cronjob_run(settings.coin, {
                                    list_blockchain_update: Math.floor(new Date() / 1000)
                                }, function(cb) {
                                    Tx.countDocuments({}, function(txerr, txcount) {
                                        Address.countDocuments({}, function(aerr, acount) {
											if(mode != "check"){
												Stats.updateOne({
													coin: coin
												}, {
													last: stats.count
												}, function() {});
											}
                                            logger.info('%s complete (Last Block: %s)', mode, nstats.last);
                                            var stats = {
                                                tx_count: txcount,
                                                address_count: acount,
                                                seconds: (e_timer - s_timer) / 1000,
                                            };
                                            logger.info("Sync had a run time of %s and now has %s transactions and %s acount recorded", stats.seconds.toHHMMSS(), stats.tx_count, stats.address_count);
                                            exit();
                                        });
                                    });
                                    exit();
                                });
                            });
                        });
                    });
                } else if(numWorkersNeeded > 1) {
                    workerLog.info("There are %s workers still needed", numWorkersNeeded);
                    var end = Math.round(params.startAtBlock + MaxPerWorker) - 1;
                    if (end > stats.count) {
                        end = stats.count;
                    }
                    cluster.fork({
                        start: params.startAtBlock,
                        end: end,
						wid: numWorkers,
						func: mode,
						workload: work
					})
					numWorkersNeeded = (numWorkersNeeded > 1 ? numWorkersNeeded - 1 : 0);
                    numWorkers++;
                    params.startAtBlock += Math.round(MaxPerWorker);
                    params.highestBlock = Math.round(params.startAtBlock + MaxPerWorker) - 1
                }
            } else {
                logger.trace('Unknown message:', msg);
            }
        });
    } else {
        onlyConsole.trace("There were %s blocks to get, which is strange. We're exiting now", BlocksToGet);
        exit();
    }
}

var dbString = 'mongodb://' + settings.dbsettings.user;
dbString = dbString + ':' + settings.dbsettings.password;
dbString = dbString + '@' + settings.dbsettings.address;
dbString = dbString + ':' + settings.dbsettings.port;
dbString = dbString + '/' + settings.dbsettings.database;

if(cluster.isMaster){
    is_locked(function(exists) {
        if (exists && cluster.isMaster) {
            console.log("Script already running..");
            process.exit(0);
        } else {
            create_lock(function() {
                logger.info("script launched with pid:" + process.pid);
                mongoose.connect(dbString, {
                    useNewUrlParser: true
                }, function(err) {
                    if (err) {
                        onlyConsole.trace('Unable to connect to database: %s', dbString);
                        onlyConsole.trace('Aborting');
                        exit();
                    } else if (database == 'index') {
                        if(cluster.isMaster){
                            db.check_stats(settings.coin, function(exists) {
                                if (exists == false) {
                                    onlyConsole.trace('Run \'npm start\' to create database structures before running this script.');
                                    exit();
                                }
                            });
                        }
                        if (mode == 'checkMissing') {
    
                        } else if (mode == 'check') {
                                db.get_stats(settings.coin, function(stats) {
                                    var blocks = [];
                                    var intvera;
                                    logger.info("Please wait, generating a list of blocks.");
                                    for (intvera = 1; intvera < stats.last; intvera++) {
                                        blocks.push(intvera);
                                    }
                                    logger.info("Done, moving on to checking what blocks are in the DB.");
                                    var jsonraw = JSON.parse("[" + blocks + "]");
                                    var distinct = Tx.distinct("blockindex");
                                    var missing = [];
                                    distinct.exec(function(err, res) {
                                        logger.info("There are %s known blocks", res.length);
                                        jsonraw.forEach(function(block) {
                                            var found = false;
                                            for (var t = 0; t < res.length; t++) {
                                                if (block == res[t]) {
                                                    found = true;
                                                }
                                            }
                                            if (found == false) {
                                                missing.push(block);
                                            }
                                        });
                                        //fs.writeFileSync(fname, "[" + missing + "]");
                                        if (JSON.parse(["[" + missing + "]"]).length == 0) {
                                            onlyConsole.trace('There are no missing blocks.');
                                            exit();
                                        }
                                        var s_timer = new Date().getTime();
                                        db.update_db(settings.coin, function() {
                                            numWorkers = 0;
                                            numWorkersNeeded = 0;
                                            var params = {
                                                'highestBlock': stats.count,
                                                'startAtBlock': 0
                                            };
                                            clusterStart(stats, params);
                                        });
                                    });
                                });
                        } else {
                                var s_timer = new Date().getTime();
                                db.update_db(settings.coin, function() {
                                    numWorkers = 0;
                                    numWorkersNeeded = 0;
                                    db.get_stats(settings.coin, function(stats) {
                                        if (settings.heavy == true) {
                                            db.update_heavy(settings.coin, stats.count, 20, function() {
    
                                            });
                                        }
                                        var params = {
                                            'highestBlock': stats.count,
                                            'startAtBlock': stats.last
                                        };
                                        if (mode == 'reindex') {
                                            logger.info('starting Reindex');
                                            params.highestBlock = 0;
                                            params.startAtBlock = 1;
                                            Address.deleteMany({}, function(err2, res1) {
                                                AddressTx.deleteMany({}, function(err3, res2) {
                                                    Tx.deleteMany({}, function(err4, res3) {
                                                        Richlist.updateOne({
                                                            coin: settings.coin
                                                        }, {
                                                            received: [],
                                                            balance: [],
                                                        }, function(err3) {
                                                            Stats.updateOne({
                                                                coin: settings.coin
                                                            }, {
                                                                last: 0,
                                                            }, function(reste) {
                                                                logger.info(reste);
                                                                logger.info('index cleared (reindex)');
                                                                clusterStart(stats, params);
                                                            });
                                                        });
                                                    });
                                                });
                                            });
                                        } else {
                                            clusterStart(stats, params);
                                        }
                                    });
                                });
                            }
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
                                            logger.info('%s market data updated successfully.', mkt);
                                            complete++;
                                            if (complete == markets.length) {
                                                db.update_cronjob_run(settings.coin, {
                                                    list_market_update: Math.floor(new Date() / 1000)
                                                }, function(cb) {
                                                    exit();
                                                });
                                            }
                                        } else {
                                            logger.info('%s: %s', mkt, err);
                                            complete++;
                                            if (complete == markets.length) {
                                                db.update_cronjob_run(settings.coin, {
                                                    list_market_update: Math.floor(new Date() / 1000)
                                                }, function(cb) {
                                                    exit();
                                                });
                                            }
                                        }
                                    });
                                } else {
                                    onlyConsole.trace('error: entry for %s does not exists in markets db.', mkt);
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
}else{
    mongoose.connect(dbString, {
        useNewUrlParser: true
    }, function(err) {
        if(err){
            onlyConsole.trace("Worker could not connect to Mongo.");
        }else{
            workerLog.info("Worker [%s] %s is starting, start at index %s and end at index %s",
                cluster.worker.process.env['wid'],
                cluster.worker.process.pid,
                cluster.worker.process.env['start'],
                cluster.worker.process.env['end']
            )
            db.update_tx_db(settings.coin, Number(cluster.worker.process.env['start']), Number(cluster.worker.process.env['end']), settings.update_timeout, function() {
                process.send({
                    pid: cluster.worker.process.pid,
                    wid: cluster.worker.process.pid,
                    msg: 'done'
                });
                logger.info('Worker %s has finished their update. Killing worker.', cluster.worker.process.pid);
            });
        }
    });
}
