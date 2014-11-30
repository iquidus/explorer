var request = require('request')
  , settings = require('./settings')
  , Address = require('../models/address');

var base_url = 'http://127.0.0.1:' + settings.port + '/api/';


// returns coinbase total sent as current coin supply
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

  convert_to_satoshi: function(amount, cb) {
    // fix to 8dp & convert to string
    var fixed = amount.toFixed(8).toString(); 
    // remove decimal (.) and return integer 
    return cb(parseInt(fixed.replace('.', '')));
  },

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
              if (index % 100 === 0) { //clear stack
                setTimeout(function() {
                  process(loop); // Run our process, pass in the loop
                }, 1);
              } else {
                 process(loop); // Run our process, pass in the loop
              }
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

  balance_supply: function(cb) {
    Address.find({}, 'balance').where('balance').gt(0).exec(function(err, docs) { 
      var count = 0;
      module.exports.syncLoop(docs.length, function (loop) {
        var i = loop.iteration();
        count = count + docs[i].balance;
        loop.next();
      }, function(){
        return cb(count);
      });
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
    } else if (settings.supply == 'BALANCES') {
      module.exports.balance_supply(function(supply) {
        return cb(supply/100000000);
      });
    } else {
      coinbase_supply(function(supply) {
        return cb(supply/100000000);
      });
    }
  },

  is_unique: function(array, object, cb) {
    var unique = true;
    var index = null;
    module.exports.syncLoop(array.length, function (loop) {
      var i = loop.iteration();
      if (array[i].addresses == object) {
        unique = false;
        index = i;
        loop.break(true);
        loop.next();
      } else {
        loop.next();
      }
    }, function(){
      return cb(unique, index);
    });
  },

  calculate_total: function(vout, cb) {
    var total = 0;
    module.exports.syncLoop(vout.length, function (loop) {
      var i = loop.iteration();
      module.exports.convert_to_satoshi(parseFloat(vout[i].amount), function(amount_sat){
        total = total + amount_sat;
        loop.next();
      });
    }, function(){
      return cb(total);
    });
  },

  prepare_vout: function(vout, txid, cb) {
    var arr_vout = [];

    module.exports.syncLoop(vout.length, function (loop) {
      var i = loop.iteration();
      // make sure vout has an address
      if (vout[i].scriptPubKey.type != 'nonstandard') { 
        // check if vout address is unique, if so add it array, if not at its amount to existing index
        //console.log('vout:' + i + ':' + txid);
        module.exports.is_unique(arr_vout, vout[i].scriptPubKey.addresses[0], function(unique, index) {
          if (unique == true) {
            // unique vout
            arr_vout.push({addresses: vout[i].scriptPubKey.addresses, amount: vout[i].value});
            loop.next();
          } else {
            // already exists
            arr_vout[index].amount = parseFloat(arr_vout[index].amount) + parseFloat(vout[i].value);
            loop.next();
          }
        });
      } else {
        // no address, move to next vout
        loop.next();
      }
    }, function(){

      return cb(arr_vout);
    });
  },

  get_input_addresses: function(input, vout, cb) {
    var addresses = [];
    if (input.coinbase) {
      var amount = 0;
      module.exports.syncLoop(vout.length, function (loop) {
        var i = loop.iteration();
          amount = amount + parseFloat(vout[i].value);  
          loop.next();
      }, function(){
        addresses.push({hash: 'coinbase', amount: amount});
        return cb(addresses);
      });
    } else {
      module.exports.get_rawtransaction(input.txid, function(tx){
        if (tx) {
          module.exports.syncLoop(tx.vout.length, function (loop) {
            var i = loop.iteration();
            if (tx.vout[i].n == input.vout) {
              addresses.push({hash: tx.vout[i].scriptPubKey.addresses[0], amount:tx.vout[i].value});  
              loop.break(true);
              loop.next();
            } else {
              loop.next();
            } 
          }, function(){
            return cb(addresses);
          });
        } else {
          return cb();
        }
      });
    }
  },

  prepare_vin: function(tx, cb) {
    var arr_vin = [];
    module.exports.syncLoop(tx.vin.length, function (loop) {
      var i = loop.iteration();
      module.exports.get_input_addresses(tx.vin[i], tx.vout, function(addresses){
        if (addresses) {
          //console.log('vin');
          module.exports.is_unique(arr_vin, addresses[0].hash, function(unique, index) {
            if (unique == true) {
              arr_vin.push({addresses:addresses[0].hash, amount:addresses[0].amount});
            } else {
              arr_vin[index].amount = parseFloat(arr_vin[index].amount) + parseFloat(addresses[0].amount);
            }
          });
          loop.next();
        } else {
          loop.next();
        }
      });
    }, function(){
      return cb(arr_vin);
    });
  }
};