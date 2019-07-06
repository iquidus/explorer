var mongoose = require('mongoose')
  , db = require('../lib/database')
  , Tx = require('../models/tx')  
  , Address = require('../models/address')  
  , settings = require('../lib/settings');
  const cluster = require('cluster');
  const numCPUs = require('os').cpus().length;

var COUNT = 5000; //number of blocks to index
var MaxWorkers = 4; //not used yet
var MaxPerWorker = 2000;

function exit() {  
  //mongoose.disconnect();
  process.exit(0);
}

var dbString = 'mongodb://' + settings.dbsettings.user;
dbString = dbString + ':' + settings.dbsettings.password;
dbString = dbString + '@' + settings.dbsettings.address;
dbString = dbString + ':' + settings.dbsettings.port;
dbString = dbString + "/"+ settings.dbsettings.database;

mongoose.set('useCreateIndex', true);
mongoose.connect(dbString, { createIndexes: true, useNewUrlParser: true }, function(err) {
    if (err) {
        console.log('Unable to connect to database: %s', dbString);
        console.log('Aborting');
        exit();
    }
    numWorkers = 0;
    numWorkersNeeded = 0;
    if(cluster.isMaster){
        Tx.deleteMany({}, function(err, txes) { 
            Address.deleteMany({}, function(err2, addr) { 
                console.log('deleted %s txes, %s addresses', txes.n, addr.n)
            });
        });
        var s_timer = new Date().getTime();
        db.get_stats(settings.coin, function(stats){
            numWorkersNeeded = Math.round(stats.count / MaxPerWorker);
            //exit();
            //console.log(`Master ${process.pid} is running`);
            // Fork workers.
            var highestBlock = 0;
            var startAtBlock = 1;
            for (let i = 0; i < numCPUs; i++) {
                    cluster.fork({start:startAtBlock, end: Math.round(startAtBlock + MaxPerWorker) - 1, wid:i})
                    numWorkers++;
                    numWorkersNeeded= numWorkersNeeded -1;
                    startAtBlock+=Math.round(MaxPerWorker);
                    highestBlock = Math.round(startAtBlock + MaxPerWorker) - 1
            }

           
                cluster.on('message', function(worker, msg){
                    console.log(`worker ${worker.id} died`);
                    if(msg.msg == "done"){
                        worker.disconnect();
                        console.log(`worker ${msg.pid} died`);
                        numWorkersNeeded = numWorkersNeeded - 1;
                        console.log("There are %s workers still needed", numWorkersNeeded);
                        if(numWorkersNeeded == 0){
                            var e_timer = new Date().getTime();
                            Tx.countDocuments({}, function(txerr, txcount){
                                Address.countDocuments({}, function(aerr, acount){
                                var stats = {
                                    tx_count: txcount,
                                    address_count: acount,
                                    seconds: (e_timer - s_timer)/1000,
                                };
                                console.log(stats);
                                exit();
                                });
                            });
                        }
                        else{
                            cluster.fork({start:startAtBlock, end: Math.round(startAtBlock + MaxPerWorker) - 1, wid:numWorkers})
                            numWorkers++;
                            startAtBlock+=Math.round(MaxPerWorker);
                            highestBlock = Math.round(startAtBlock + MaxPerWorker) - 1
                        }
                    }else{
                        console.log('Unknown message:', msg);
                    }
                });
            
        });
    }else{
        console.log("Worker [%s] %s is starting, start at index %s and end at index %s", cluster.worker.process.env['wid'], cluster.worker.process.pid, cluster.worker.process.env['start'],cluster.worker.process.env['end'])
        db.update_tx_db(settings.coin, Number(cluster.worker.process.env['start']), Number(cluster.worker.process.env['end']), settings.update_timeout, function(){
            process.send({pid: cluster.worker.process.pid, wid: cluster.worker.process.pid, msg: 'done'});
        });
    }
});