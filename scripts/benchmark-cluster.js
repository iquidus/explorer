var mongoose = require('mongoose')
  , db = require('../lib/database')
  , Tx = require('../models/tx')  
  , Address = require('../models/address')  
  , settings = require('../lib/settings');
  const cluster = require('cluster');
  const numCPUs = require('os').cpus().length;

var COUNT = 100; //number of blocks to index
var MaxWorkers = 4; //not used yet

function exit() {  
  //mongoose.disconnect();
  process.exit(0);
}

var dbString = 'mongodb://' + settings.dbsettings.user;
dbString = dbString + ':' + settings.dbsettings.password;
dbString = dbString + '@' + settings.dbsettings.address;
dbString = dbString + ':' + settings.dbsettings.port;
dbString = dbString + "/" + settings.dbsettings.database;

mongoose.set('useCreateIndex', true);
mongoose.connect(dbString, { useNewUrlParser: true }, function(err) {
    if (err) {
        console.log('Unable to connect to database: %s', dbString);
        console.log('Aborting');
        exit();
    }
    var s_timer = new Date().getTime();
    numWorkers = 0;
    if(cluster.isMaster){
        //console.log(`Master ${process.pid} is running`);
        // Fork workers.
        for (let i = 0; i < numCPUs; i++) {
            if(i == 0){
            cluster.fork({start:1, end: (Math.round((COUNT/numCPUs)*(i+1))-1), wid:i})
            numWorkers++;
            }else if(i==numCPUs - 1){
                cluster.fork({start:Math.round((COUNT/numCPUs)*i), end: (Math.round((COUNT/numCPUs)*(i+1))), wid:i})
                numWorkers++;
            }else{
                cluster.fork({start:Math.round((COUNT/numCPUs)*i), end: (Math.round((COUNT/numCPUs)*(i+1))-1), wid:i})
                numWorkers++;
            }
        }

        for (const id in cluster.workers){
            cluster.workers[id].on('message', function(msg){
                //console.log(`worker ${worker.process.pid} died`);
                numWorkers = numWorkers - 1;
                if(numWorkers == 0){
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
                }
            });
        }
    }else{
        console.log("Worker [%s] %s is starting, start at index %s and end at index %s", cluster.worker.process.env['wid'], cluster.worker.process.pid, cluster.worker.process.env['start'],cluster.worker.process.env['end'])
        Tx.deleteMany({}, function(err) { 
            Address.deleteMany({}, function(err2) { 
            db.update_tx_db(settings.coin, Number(cluster.worker.process.env['start']), Number(cluster.worker.process.env['end']), settings.update_timeout, function(){
                process.send({pid: cluster.worker.process.pid, wid: cluster.worker.process.pid, msg: 'done'});
            });
            });
        });
    }
});