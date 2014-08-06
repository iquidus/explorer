var mongoose = require('mongoose')
  , db = require('../lib/database')
  , settings = require('../lib/settings')
  , fs = require('fs');

// timeout (in ms) before closing db connection.
var TIMEOUT = 15000;


function create_lock(cb) {
  fs.appendFile('../tmp/blocknotify.pid', process.pid, function (err) {
    if (err) {
      console.log("Unable to create blocknotify.pid..");
      process.exit(1);
    } else {
      return cb();
    }
  });
}

function remove_lock(cb) {
  fs.unlink('../tmp/blocknotify.pid', function (err){
    if(err) {
      console.log("unable to remove lock..");
      process.exit(1);
    } else {
      return cb();
    }
  });
}

function is_locked(cb) {
  fs.exists('../tmp/blocknotify.pid', function (exists){
    if(exists) {
      return cb(true);
    } else {
      return cb(false);
    }
  });
}

function exit() {
  remove_lock(function(){
    mongoose.disconnect();
    process.exit(0);
  });
}

var dbString = "mongodb://" + settings.dbsettings.address;
dbString = dbString + ":" + settings.dbsettings.port;
dbString = dbString + "/" + settings.dbsettings.database;

is_locked(function (exists) {
  if (exists) {
    console.log("Script already running..");
    process.exit(0);
  } else {
    create_lock(function (){
      console.log("script launched with pid: " + process.pid);
      mongoose.connect(dbString, function(err) {
        if (err) {
          console.log('Unable to connect to database: %s', dbString);
          console.log('Aborting');
          exit();
        } else {
          db.check_stats(settings.coin, function(exists) {
            if (exists == false) {
              exit();
            } else {
              db.update_db(settings.coin, function(){
                setTimeout(function () {exit();},TIMEOUT);
              });
            }
          });
        }
      });
    });
  }
});