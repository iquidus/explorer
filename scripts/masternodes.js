var mongoose = require('mongoose')
  , lib = require('../lib/explorer')
  , db = require('../lib/database')
  , settings = require('../lib/settings')
  , request = require('request')
  , cmp = require('semver-compare');

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

function create_peers(address, protocol, version){
  request({uri: 'http://api.ipstack.com/' + address + '?access_key=' + settings.peers.apikey, json: true}, function (error, response, geo) {
    db.create_peer({
      address: address,
      protocol: protocol,
      version: version,
      //todo
      //semver: semver,
      country: geo.country_name
    }, function(){

    });
  });
}

mongoose.connect(dbString, { useCreateIndex: true,
  useNewUrlParser: true
}, function(err) {
  if (err) {
    console.log('Unable to connect to database: %s', dbString);
    console.log('Aborting');
    exit();
  } else {
    request({uri: 'http://127.0.0.1:' + settings.port + '/api/listmasternodes', json: true}, function (error, response, body) {
      var livepeers = [];
      if(settings.peers.purge_on_run) {
        db.purge_peers();
      }
      lib.syncLoop(body.length, function (loop) {
        var i = loop.iteration();
        //https://github.com/suprnurd/ciquidus/pull/11/commits/61dec88f1b660aabdfdebef6fb3068186eb047de
        var address = body[i].addr
        if (body[i].addr.indexOf('[') == 0 && body[i].addr.indexOf(']') > -1) {
          address = address.slice(1, address.indexOf(']'));
        }else{
          address = address.split(':')[0];
        }
        //end
        var version = body[i].subver.replace('/', '').replace('/', '');
        var semver = version.split(":")[1];
        livepeers[i] = address;
        db.find_peers(address, function(peer) {
          if (peer.length) {
              for(i=0; i<peer.length; i++){
                // cmp(a,b)
                // result 1 = a is greater than b
                // result 0 = a is the same as b
                // result -1 = a is less than b
                if(cmp(peer[i].version.split(":")[1], semver) == -1){
                  if(settings.peers.purge_on_run != true){
                    db.delete_peer({_id:peer[i]._id});
                  }
                  create_peers(address, body[i].version, version);
                  //console.log('Delete the db version:', peer[i].version.split(":")[1]); //remove
                } else if(cmp(peer[i].version.split(":")[1], semver) == 0){
                    //console.log('Do nothing, they\'re the same');
                } else {
                  //db.delete_peer({_id:peer[i]._id});
                  console.log('This should never occur, Live Version:', semver, " Is less than:", peer[i].version.split(":")[1]); //remove
                }
              }
              loop.next();
          } else {
            create_peers(address, body[i].version, version);            
            loop.next();
          }
        });
      },function(){
        db.get_peers(function(peers){
          for( var i = 0; i < peers.length; i++){
            if(!livepeers.includes(peers[i].address)){
              db.delete_peer({address:peers[i].address});
            }
          }
		      exit();
        });
      });
    });
  };
});