var request = require('request')
  , settings = require('./settings')
  , Address = require('../models/address');

var base_url = 'http://127.0.0.1:' + settings.port + '/api/';

const Client = require('bitcoin-core');
const client = new Client(settings.wallet);


// returns coinbase total sent as current coin supply
function coinbase_supply(cb) {
  Address.findOne({a_id: 'coinbase'}, function(err, address) {
    if (address) {
      return cb(address.sent);
    } else {
      return cb(0);
    }
  });
}

function rpcCommand(params, cb) {
  client.command([{method: params[0].method, parameters: params[0].parameters}], function(err, response){
    if(err){console.log('Error: ', err); }
    else{
      if(response[0].name == 'RpcError'){
        return cb('There was an error. Check your console.');
      }
      return cb(response[0]);
    }
  });
}

function processVoutAddresses(address_list, vout_value, arr_vout, cb) {
  // check if there are any addresses to process
  if (address_list != null && address_list.length > 0) {
    // check if vout address is unique, if so add to array, if not add its amount to existing index
    module.exports.is_unique(arr_vout, address_list[0], function(unique, index) {
      if (unique == true) {
        // unique vout
        module.exports.convert_to_satoshi(parseFloat(vout_value), function(amount_sat){
          arr_vout.push({addresses: address_list[0], amount: amount_sat});
          return cb(arr_vout);
        });
      } else {
        // already exists
        module.exports.convert_to_satoshi(parseFloat(vout_value), function(amount_sat){
          arr_vout[index].amount = arr_vout[index].amount + amount_sat;
          return cb(arr_vout);
        });
      }
    });
  } else {
    // no address, move to next vout
    return cb(arr_vout);
  }
}

function encodeP2PKaddress(p2pk_descriptor, cb) {
  // find the descriptor value
  module.exports.get_descriptorinfo(p2pk_descriptor, function(descriptor_info) {
    // check for errors
    if (descriptor_info != null) {
      // encode the address using the output descriptor
      module.exports.get_deriveaddresses(descriptor_info.descriptor, function(p2pkh_address) {
        // check for errors
        if (p2pkh_address != null) {
          // return P2PKH address
          return cb(p2pkh_address);
        } else {
          // address could not be encoded
          return cb(null);
        }
      });
    } else {
      // address could not be encoded
      return cb(null);
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
    if (settings.index.show_hashrate == false) return cb('-');
    if (settings.use_rpc) {
      if (settings.nethash == 'netmhashps') {
        rpcCommand([{method:'getmininginfo', parameters: []}], function(response){
          if (response == 'There was an error. Check your console.') { return cb(response);}
          if (response.netmhashps) {
            response.netmhashps = parseFloat(response.netmhashps);
            if (settings.nethash_units == 'K') {
              return cb((response.netmhashps * 1000).toFixed(4));
            } else if (settings.nethash_units == 'G') {
              return cb((response.netmhashps / 1000).toFixed(4));
            } else if (settings.nethash_units == 'H') {
              return cb((response.netmhashps * 1000000).toFixed(4));
            } else if (settings.nethash_units == 'T') {
              return cb((response.netmhashps / 1000000).toFixed(4));
            } else if (settings.nethash_units == 'P') {
              return cb((response.netmhashps / 1000000000).toFixed(4));
            } else {
              return cb(response.netmhashps.toFixed(4));
            }
          } else {
            return cb('-');
          }
        });
      } else {
        rpcCommand([{method:'getnetworkhashps', parameters: []}], function(response){
          if (response == 'There was an error. Check your console.') { return cb(response);}
            if (response) {
              response = parseFloat(response);
              if (settings.nethash_units == 'K') {
                return cb((response / 1000).toFixed(4));
              } else if (settings.nethash_units == 'M'){
                return cb((response / 1000000).toFixed(4));
              } else if (settings.nethash_units == 'G') {
                return cb((response / 1000000000).toFixed(4));
              } else if (settings.nethash_units == 'T') {
                return cb((response / 1000000000000).toFixed(4));
              } else if (settings.nethash_units == 'P') {
                return cb((response / 1000000000000000).toFixed(4));
              } else {
                return cb((response).toFixed(4));
              }
            } else {
              return cb('-');
            }
        });
      }
    }else{
      if (settings.nethash == 'netmhashps') {
        var uri = base_url + 'getmininginfo';
        request({uri: uri, json: true}, function (error, response, body) { //returned in mhash
          if (body.netmhashps) {
            if (settings.nethash_units == 'K') {
              return cb((body.netmhashps * 1000).toFixed(4));
            } else if (settings.nethash_units == 'G') {
              return cb((body.netmhashps / 1000).toFixed(4));
            } else if (settings.nethash_units == 'H') {
              return cb((body.netmhashps * 1000000).toFixed(4));
            } else if (settings.nethash_units == 'T') {
              return cb((body.netmhashps / 1000000).toFixed(4));
            } else if (settings.nethash_units == 'P') {
              return cb((body.netmhashps / 1000000000).toFixed(4));
            } else {
              return cb(body.netmhashps.toFixed(4));
            }
          } else {
            return cb('-');
          }
        });
      } else {
        var uri = base_url + 'getnetworkhashps';
        request({uri: uri, json: true}, function (error, response, body) {
          if (body == 'There was an error. Check your console.') {
            return cb('-');
          } else {
            if (settings.nethash_units == 'K') {
              return cb((body / 1000).toFixed(4));
            } else if (settings.nethash_units == 'M'){
              return cb((body / 1000000).toFixed(4));
            } else if (settings.nethash_units == 'G') {
              return cb((body / 1000000000).toFixed(4));
            } else if (settings.nethash_units == 'T') {
              return cb((body / 1000000000000).toFixed(4));
            } else if (settings.nethash_units == 'P') {
              return cb((body / 1000000000000000).toFixed(4));
            } else {
              return cb((body).toFixed(4));
            }
          }
        });
      }
    }
  },


  get_difficulty: function(cb) {
    if (settings.use_rpc) {
      rpcCommand([{method:'getdifficulty', parameters: []}], function(response){
        return cb(response);
      });
    } else {
      var uri = base_url + 'getdifficulty';
      request({uri: uri, json: true}, function (error, response, body) {
        return cb(body);
      });
    }
  },

  get_connectioncount: function(cb) {
    if (settings.use_rpc) {
      rpcCommand([{method:'getconnectioncount', parameters: []}], function(response){
        return cb(response);
      });
    } else {
      var uri = base_url + 'getconnectioncount';
      request({uri: uri, json: true}, function (error, response, body) {
        return cb(body);
      });
    }
  },

  get_blockcount: function(cb) {
    if (settings.use_rpc) {
      rpcCommand([{method:'getblockcount', parameters: []}], function(response){
        return cb(response);
      })
    } else {
      var uri = base_url + 'getblockcount';
      request({uri: uri, json: true}, function (error, response, body) {
        return cb(body);
      });
    }
  },

  get_blockhash: function(height, cb) {
    if (settings.use_rpc) {
      rpcCommand([{method:'getblockhash', parameters: [parseInt(height)]}], function(response){
        return cb(response);
      });
    } else {
      var uri = base_url + 'getblockhash?height=' + height;
      request({uri: uri, json: true}, function (error, response, body) {
        return cb(body);
      });
    }
  },

  get_block: function(hash, cb) {
    if (settings.use_rpc) {
      rpcCommand([{method:'getblock', parameters: [hash]}], function(response){
        return cb(response);
      });
    } else {
      var uri = base_url + 'getblock?hash=' + hash;
      request({uri: uri, json: true}, function (error, response, body) {
        return cb(body);
      });
    }
  },

  get_rawtransaction: function(hash, cb) {
    if (settings.use_rpc) {
      rpcCommand([{method:'getrawtransaction', parameters: [hash, 1]}], function(response){
        return cb(response);
      });
    } else {
      var uri = base_url + 'getrawtransaction?txid=' + hash + '&decrypt=1';
      request({uri: uri, json: true}, function (error, response, body) {
        return cb(body);
      });
    }
  },

  get_maxmoney: function(cb) {
    if (settings.use_rpc) {
      rpcCommand([{method:'getmaxmoney', parameters: []}], function(response){
        return cb(response);
      });
    } else {
      var uri = base_url + 'getmaxmoney';
      request({uri: uri, json: true}, function (error, response, body) {
        return cb(body);
      });
    }
  },

  get_maxvote: function(cb) {
    if (settings.use_rpc) {
      rpcCommand([{method:'getmaxvote', parameters: []}], function(response){
        return cb(response);
      });
    } else {
      var uri = base_url + 'getmaxvote';
      request({uri: uri, json: true}, function (error, response, body) {
        return cb(body);
      }); 
    }
  },

  get_vote: function(cb) {
    if (settings.use_rpc) {
      client.command([{method:'getvote', parameters: []}], function(err, response){
        if(err){console.log('Error: ', err); }
        else{
          if(response[0].name == 'RpcError'){
            return cb('There was an error. Check your console.');
          }
          return cb(response[0]);
        }
      });
    } else {
      var uri = base_url + 'getvote';
      request({uri: uri, json: true}, function (error, response, body) {
        return cb(body);
      }); 
    }
  },

  get_phase: function(cb) {
    if (settings.use_rpc) {
      client.command([{method:'getphase', parameters: []}], function(err, response){
        if(err){console.log('Error: ', err); }
        else{
          if(response[0].name == 'RpcError'){
            return cb('There was an error. Check your console.');
          }
          return cb(response[0]);
        }
      });
    } else {
      var uri = base_url + 'getphase';
      request({uri: uri, json: true}, function (error, response, body) {
        return cb(body);
      }); 
    }
  },

  get_reward: function(cb) {
    if (settings.use_rpc) {
      client.command([{method:'getreward', parameters: []}], function(err, response){
        if(err){console.log('Error: ', err); }
        else{
          if(response[0].name == 'RpcError'){
            return cb('There was an error. Check your console.');
          }
          return cb(response[0]);
        }
      });
    } else {
      var uri = base_url + 'getreward';
      request({uri: uri, json: true}, function (error, response, body) {
        return cb(body);
      }); 
    }
  },

  get_estnext: function(cb) {
    if (settings.use_rpc) {
      client.command([{method:'getnextrewardestimate', parameters: []}], function(err, response){
        if(err){console.log('Error: ', err); }
        else{
          if(response[0].name == 'RpcError'){
            return cb('There was an error. Check your console.');
          }
          return cb(response[0]);
        }
      });
    } else {
      var uri = base_url + 'getnextrewardestimate';
      request({uri: uri, json: true}, function (error, response, body) {
        return cb(body);
      }); 
    }
  },

  get_nextin: function(cb) {
    if (settings.use_rpc) {
      client.command([{method:'getnextrewardwhenstr', parameters: []}], function(err, response){
        if(err){console.log('Error: ', err); }
        else{
          if(response[0].name == 'RpcError'){
            return cb('There was an error. Check your console.');
          }
          return cb(response[0]);
        }
      });
    } else {
      var uri = base_url + 'getnextrewardwhenstr';
      request({uri: uri, json: true}, function (error, response, body) {
        return cb(body);
      }); 
    }
  },

  get_descriptorinfo: function(descriptor, cb) {
    var cmd_name = 'getdescriptorinfo';
    // format the descriptor correctly for use in the getdescriptorinfo cmd
    descriptor = 'pkh(' + descriptor.replace(' OP_CHECKSIG', '') + ')';

    if (settings.use_rpc) {
      rpcCommand([{method:cmd_name, parameters: [descriptor]}], function(response){
        // check if there was an error
        if (response != null && response != 'There was an error. Check your console.') {
          // return the rpc response
          return cb(response);
        } else {
          // an error occurred
          console.log(cmd_name + ' error: ' + (response == null ? 'Method not found' : response));
          // return null
          return cb(null);
        }
      });
    } else {
      var uri = base_url + cmd_name + '?descriptor=' + encodeURIComponent(descriptor);
      request({uri: uri, json: true}, function (error, response, body) {
        // check if there was an error
        if (error == null && (body.message == null || body.message != 'Method not found')) {
          // return the request body
          return cb(body);
        } else {
          // an error occurred
          console.log(cmd_name + ' error: ' + (error == null ? body.message : error));
          // return null
          return cb(null);
        }
      });
    }
  },

  get_deriveaddresses: function(descriptor, cb) {
    var cmd_name = 'deriveaddresses';

    if (settings.use_rpc) {
      rpcCommand([{method:cmd_name, parameters: [descriptor]}], function(response){
        // check if there was an error
        if (response != null && response != 'There was an error. Check your console.') {
          // return the rpc response
          return cb(response);
        } else {
          // an error occurred
          console.log(cmd_name + ' error: ' + (response == null ? 'Method not found' : response));
          // return null
          return cb(null);
        }
      });
    } else {
      var uri = base_url + cmd_name + '?descriptor=' + encodeURIComponent(descriptor);
      request({uri: uri, json: true}, function (error, response, body) {
        // check if there was an error
        if (error == null && (body.message == null || body.message != 'Method not found')) {
          // return the request body
          return cb(body);
        } else {
          // an error occurred
          console.log(cmd_name + ' error: ' + (error == null ? body.message : error));
          // return null
          return cb(null);
        }
      });
    }
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
    if (settings.use_rpc) {
      if ( settings.supply == 'HEAVY' ) {
        client.command([{method:'getsupply', parameters: []}], function(err, response){
          if(err){console.log('Error: ', err); }
          else{
            if(response[0].name == 'RpcError'){
              return cb('There was an error. Check your console.');
            }
            return cb(response[0]);
          }
        });
      } else if (settings.supply == 'GETINFO') {
        client.command([{method:'getinfo', parameters: []}], function(err, response){
          if(err){console.log('Error: ', err); }
          else{
            if(response[0].name == 'RpcError'){
              return cb('There was an error. Check your console.');
            }
            return cb(response[0].moneysupply);
          }
        });
      } else if (settings.supply == 'BALANCES') {
        module.exports.balance_supply(function(supply) {
          return cb(supply/100000000);
        });
      } else if (settings.supply == 'TXOUTSET') {
        client.command([{method:'gettxoutsetinfo', parameters: []}], function(err, response){
          if(err){console.log('Error: ', err); }
          else{
            if(response[0].name == 'RpcError'){
              return cb('There was an error. Check your console.');
            }
            return cb(response[0].total_amount);
          }
        });
      } else {
        coinbase_supply(function(supply) {
          return cb(supply/100000000);
        });
      }
    } else {
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
      } else if (settings.supply == 'TXOUTSET') {
        var uri = base_url + 'gettxoutsetinfo';
        request({uri: uri, json: true}, function (error, response, body) {
          return cb(body.total_amount);
        });
      } else {
        coinbase_supply(function(supply) {
          return cb(supply/100000000);
        });
      }
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
      //module.exports.convert_to_satoshi(parseFloat(vout[i].amount), function(amount_sat){
        total = total + vout[i].amount;
        loop.next();
      //});
    }, function(){
      return cb(total);
    });
  },

  prepare_vout: function(vout, txid, vin, cb) {
    var arr_vout = [];
    var arr_vin = [];
    arr_vin = vin;
    module.exports.syncLoop(vout.length, function (loop) {
      var i = loop.iteration();
      // make sure vout has an address
      if (vout[i].scriptPubKey.type != 'nonstandard' && vout[i].scriptPubKey.type != 'nulldata') {
        var address_list = vout[i].scriptPubKey.addresses;
        // check if there are one or more addresses in the vout
        if (address_list == null || address_list.length == 0) {
          // no addresses defined
          // check if there is a single address defined
          if (vout[i].scriptPubKey.address == null) {
            // no single address defined
            // assume the asm value is a P2PK (Pay To Pubkey) public key that should be encoded as a P2PKH (Pay To Pubkey Hash) address
            encodeP2PKaddress(vout[i].scriptPubKey.asm, function(p2pkh_address) {
              // check if the address was encoded properly
              if (p2pkh_address != null) {
                // process vout addresses
                processVoutAddresses(p2pkh_address, vout[i].value, arr_vout, function(vout_array) {
                  // save updated array
                  arr_vout = vout_array;
                  // move to next vout
                  loop.next();
                });
              } else {
                // could not decipher the address, move to next vout
                console.log('Failed to find vout address from ' + vout[i].scriptPubKey.asm);
                loop.next();
              }
            });
          } else {
            // process vout addresses
            processVoutAddresses([vout[i].scriptPubKey.address], vout[i].value, arr_vout, function(vout_array) {
              // save updated array
              arr_vout = vout_array;
              // move to next vout
              loop.next();
            });
          }
        } else {
          // process vout addresses
          processVoutAddresses(address_list, vout[i].value, arr_vout, function(vout_array) {
            // save updated array
            arr_vout = vout_array;
            // move to next vout
            loop.next();
          });
        }
      } else {
        // no address, move to next vout
        loop.next();
      }
    }, function(){
      if (vout[0].scriptPubKey.type == 'nonstandard') {
        if ( arr_vin.length > 0 && arr_vout.length > 0 ) {
          if (arr_vin[0].addresses == arr_vout[0].addresses) {
            //PoS
            arr_vout[0].amount = arr_vout[0].amount - arr_vin[0].amount;
            arr_vin.shift();
            return cb(arr_vout, arr_vin);
          } else {
            return cb(arr_vout, arr_vin);
          }
        } else {
          return cb(arr_vout, arr_vin);
        }
      } else {
        return cb(arr_vout, arr_vin);
      }
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
              if (tx.vout[i].scriptPubKey.addresses || tx.vout[i].scriptPubKey.address) {
                var new_address = tx.vout[i].scriptPubKey.address || tx.vout[i].scriptPubKey.addresses[0];
                addresses.push({hash: new_address, amount:tx.vout[i].value});  
                loop.break(true);
                loop.next();
              } else {
                // no addresses defined
                // assume the asm value is a P2PK (Pay To Pubkey) public key that should be encoded as a P2PKH (Pay To Pubkey Hash) address
                encodeP2PKaddress(tx.vout[i].scriptPubKey.asm, function(p2pkh_address) {
                  // check if the address was encoded properly
                  if (p2pkh_address != null) {
                    // save the P2PKH address
                    addresses.push({hash: p2pkh_address, amount: tx.vout[i].value});  
                  }
                  loop.break(true);
                  loop.next();
                });
              }
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
        if (addresses && addresses.length) {
          //console.log('vin');
          module.exports.is_unique(arr_vin, addresses[0].hash, function(unique, index) {
            if (unique == true) {
              module.exports.convert_to_satoshi(parseFloat(addresses[0].amount), function(amount_sat){
                arr_vin.push({addresses:addresses[0].hash, amount:amount_sat});
                loop.next();
              });
            } else {
              module.exports.convert_to_satoshi(parseFloat(addresses[0].amount), function(amount_sat){
                arr_vin[index].amount = arr_vin[index].amount + amount_sat;
                loop.next();
              });
            }
          });
        } else {
          loop.next();
        }
      });
    }, function(){
      return cb(arr_vin);
    });
  }
};
