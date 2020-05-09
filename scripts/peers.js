var mongoose = require('mongoose')
  , lib = require('../lib/explorer')
  , db = require('../lib/database')
  , settings = require('../lib/settings')
  , request = require('request');

var COUNT = 5000; //number of blocks to index

function exit() {
  mongoose.disconnect();
  process.exit(0);
}

var dbString = 'mongodb://' + settings.dbsettings.user;
dbString = dbString + ':' + settings.dbsettings.password;
dbString = dbString + '@' + settings.dbsettings.address;
dbString = dbString + ':' + settings.dbsettings.port;
dbString = dbString + '/' + settings.dbsettings.database;

mongoose.connect(dbString, function(err) {
  if (err) {
    console.log('Unable to connect to database: %s', dbString);
    console.log('Aborting');
    exit();
  } else {
    var peers = Array();
    var cnt = 0;
    request({uri: 'http://127.0.0.1:' + settings.port + '/api/getpeerinfo', json: true}, function (error, response, body) {
      lib.syncLoop(body.length, function (loop) {
        var i = loop.iteration();
        var address = body[i].addr.split(':')[0];
        var port = body[i].addr.split(':')[1];
        request({uri: 'https://freegeoip.app/json/' + address, json: true}, function (error, response, geo) {
          if (address.startsWith('10.') || address.startsWith('192.168') || address.startsWith('172.16')) {
            geo.country_name = '[private address]';
          }
          peers[cnt++] = {
            address: address,
            port: port,
            protocol: body[i].version,
            version: body[i].subver.replace('/', '').replace('/', ''),
            country: geo.country_name
          };
          loop.next();
        });
      }, function() {

      // insert all at once after creation
          db.drop_peers(function() {
          console.log('Dropped, rebuilding...');
          lib.syncLoop(cnt, function (loop) {
            var i = loop.iteration();
            db.create_peer(peers[i], function() {
              loop.next();
            });
          }, function() {
            exit();
          });
        });
      });
    });
  }
});
