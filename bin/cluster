var cluster = require('cluster');
var fs = require('fs');

if (cluster.isMaster) {
  fs.writeFile('./tmp/cluster.pid', process.pid, function (err) {
    if (err) {
      console.log('Error: unable to create cluster.pid');
      process.exit(1);
    } else {
      console.log('Starting cluster with pid: ' + process.pid);    
      //ensure workers exit cleanly 
      process.on('SIGINT', function() {
        console.log('Cluster shutting down..');
        for (var id in cluster.workers) {
          cluster.workers[id].kill();
        }
        // exit the master process
        process.exit(0);
      });

      // Count the machine's CPUs
      var cpuCount = require('os').cpus().length;

      // Create a worker for each CPU
      for (var i = 0; i < cpuCount; i += 1) {
        cluster.fork();
      }

      // Listen for dying workers
      cluster.on('exit', function () {
        cluster.fork();
      });
    }
  });
} else {
  require('./instance');
}