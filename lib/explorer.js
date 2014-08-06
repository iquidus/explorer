var request = require('request')
  , settings = require('./settings');

var base_url = "http://127.0.0.1:" + settings.port + "/api/";

  module.exports = {
  get_hashrate: function(cb) {
    var uri = base_url + "getnetworkhashps";
    request({uri: uri, json: true}, function (error, response, body) {
      return cb(body);
    });
  },

  get_difficulty: function(cb) {
    var uri = base_url + "getdifficulty";
    request({uri: uri, json: true}, function (error, response, body) {
      return cb(body);
    });
  },

  get_connectioncount: function(cb) {
    var uri = base_url + "getconnectioncount";
    request({uri: uri, json: true}, function (error, response, body) {
      return cb(body);
    });
  },

  get_blockcount: function(cb) {
    var uri = base_url + "getblockcount";
    request({uri: uri, json: true}, function (error, response, body) {
      return cb(body);
    });
  },

  get_blockhash: function(height, cb) {
    var str = base_url + "getblockhash?height=" + height;
    request({uri: str, json: true}, function (error, response, body) {
      return cb(body);
    });
  },

  get_block: function(hash, cb) {
    var str = base_url + "getblock?hash=" + hash;
    request({uri: str, json: true}, function (error, response, body) {
      return cb(body);
    });
  },

  get_rawtransaction: function(hash, cb) {
    var str = base_url + "getrawtransaction?txid=" + hash + "&decrypt=1";
    request({uri: str, json: true}, function (error, response, body) {
      return cb(body);
    });
  },
  // synchonous loop used to interate through chartdata array, 
  // avoid use unless absolutely neccessary
  syncLoop: function(iterations, process, exit){
    var index = 0,
        done = false,
        shouldExit = false;
    var loop = {
      next:function(){
          if(done){
              if(shouldExit && exit){
                  exit(); // Exit if we're done
              }
              return; // Stop the loop if we're done
          }
          // If we're not finished
          if(index < iterations){
              index++; // Increment our index
              process(loop); // Run our process, pass in the loop
          // Otherwise we're done
          } else {
              done = true; // Make sure we say we're done
              if(exit) exit(); // Call the callback on exit
          }
      },
      iteration:function(){
          return index - 1; // Return the loop number we're on
      },
      break:function(end){
          done = true; // End the loop
          shouldExit = end; // Passing end as true means we still call the exit callback
      }
    };
    loop.next();
    return loop;
  },
};