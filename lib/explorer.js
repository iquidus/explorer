var request = require('request')
  , settings = require('./settings')
  , Address = require('../models/address');

var base_url = 'http://127.0.0.1:' + settings.port + '/api/';

function coinbase_supply(cb) {
  Address.findOne({a_id: 'coinbase'}, function(err, address) {
    if (address) {
      return cb(address.sent);
    } else {
      return cb();
    }
  });
}

module.exports = {
  get_hashrate: function(cb) {
    if (settings.nethash == 'netmhashps') {
      var uri = base_url + 'getmininginfo';
      request({uri: uri, json: true}, function (error, response, body) {
        console.log(body);
        return cb(body.netmhashps);
      });
    } else {
      var uri = base_url + 'getnetworkhashps';
      request({uri: uri, json: true}, function (error, response, body) {
        return cb(body);
      });
    }
  },

  get_difficulty: function(cb) {
    var uri = base_url + 'getdifficulty';
    request({uri: uri, json: true}, function (error, response, body) {
      return cb(body);
    });
  },

  get_connectioncount: function(cb) {
    var uri = base_url + 'getconnectioncount';
    request({uri: uri, json: true}, function (error, response, body) {
      return cb(body);
    });
  },

  get_blockcount: function(cb) {
    var uri = base_url + 'getblockcount';
    request({uri: uri, json: true}, function (error, response, body) {
      return cb(body);
    });
  },

  get_blockhash: function(height, cb) {
    var uri = base_url + 'getblockhash?height=' + height;
    request({uri: uri, json: true}, function (error, response, body) {
      return cb(body);
    });
  },

  get_block: function(hash, cb) {
    var uri = base_url + 'getblock?hash=' + hash;
    request({uri: uri, json: true}, function (error, response, body) {
      return cb(body);
    });
  },

  get_rawtransaction: function(hash, cb) {
    var uri = base_url + 'getrawtransaction?txid=' + hash + '&decrypt=1';
    request({uri: uri, json: true}, function (error, response, body) {
      return cb(body);
    });
  },

  get_maxmoney: function(cb) {
    var uri = base_url + 'getmaxmoney';
    request({uri: uri, json: true}, function (error, response, body) {
      return cb(body);
    });
  },

  get_maxvote: function(cb) {
    var uri = base_url + 'getmaxvote';
    request({uri: uri, json: true}, function (error, response, body) {
      return cb(body);
    });
  },

  get_vote: function(cb) {
    var uri = base_url + 'getvote';
    request({uri: uri, json: true}, function (error, response, body) {
      return cb(body);
    });
  },

  get_phase: function(cb) {
    var uri = base_url + 'getphase';
    request({uri: uri, json: true}, function (error, response, body) {
      return cb(body);
    });
  },

  get_reward: function(cb) {
    var uri = base_url + 'getreward';
    request({uri: uri, json: true}, function (error, response, body) {
      return cb(body);
    });
  },

  get_supply: function(cb) {
    if ( settings.supply == 'HEAVY' ) {
      var uri = base_url + 'getsupply';
      request({uri: uri, json: true}, function (error, response, body) {
        return cb(body);
      });
    } else if (settings.supply == 'GETINFO') {
      var uri = base_url + 'getinfo';
      request({uri: uri, json: true}, function (error, response, body) {
        return cb(body.moneysupply);
      });
    } else {
      coinbase_supply(function(supply) {
        return cb(supply);
      });
    }
  },

  get_estnext: function(cb) {
    var uri = base_url + 'getnextrewardestimate';
    request({uri: uri, json: true}, function (error, response, body) {
      return cb(body);
    });
  },

  get_nextin: function(cb) {
    var uri = base_url + 'getnextrewardwhenstr';
    request({uri: uri, json: true}, function (error, response, body) {
      return cb(body);
    });
  },
  
  // synchonous loop used to interate through an array, 
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