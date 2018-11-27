const request = require('request'),
  settings = require('./settings'),
  Address = require('../models/address'),
  { deepEqual } = require('./util')

const base_url = 'http://127.0.0.1:' + settings.port + '/api/'

// returns coinbase total sent as current coin supply
function coinbase_supply (cb) {
  Address.findOne({a_id: 'coinbase'}, (err, address) => cb(address || undefined))
}

module.exports = {

  convert_to_satoshi (amount, cb) {
    const ret = amount.toFixed(8) * 100000000
    return cb ? cb(ret) : ret
  },

  get_hashrate (cb) {
    if (settings.index.show_hashrate == false) return cb('-')
    if (settings.nethash == 'netmhashps') {
      request({uri: base_url + 'getmininginfo', json: true}, function (error, response, body) { // returned in mhash
        if (body.netmhashps) {
          if (settings.nethash_units == 'K') {
            return cb((body.netmhashps * 1000).toFixed(4))
          } else if (settings.nethash_units == 'G') {
            return cb((body.netmhashps / 1000).toFixed(4))
          } else if (settings.nethash_units == 'H') {
            return cb((body.netmhashps * 1000000).toFixed(4))
          } else if (settings.nethash_units == 'T') {
            return cb((body.netmhashps / 1000000).toFixed(4))
          } else if (settings.nethash_units == 'P') {
            return cb((body.netmhashps / 1000000000).toFixed(4))
          } else {
            return cb(body.netmhashps.toFixed(4))
          }
        } else {
          return cb('-')
        }
      })
    } else {
      request({uri: base_url + 'getnetworkhashps', json: true}, function (error, response, body) {
        if (body == 'There was an error. Check your console.') {
          return cb('-')
        } else {
          if (settings.nethash_units == 'K') {
            return cb((body / 1000).toFixed(4))
          } else if (settings.nethash_units == 'M') {
            return cb((body / 1000000).toFixed(4))
          } else if (settings.nethash_units == 'G') {
            return cb((body / 1000000000).toFixed(4))
          } else if (settings.nethash_units == 'T') {
            return cb((body / 1000000000000).toFixed(4))
          } else if (settings.nethash_units == 'P') {
            return cb((body / 1000000000000000).toFixed(4))
          } else {
            return cb((body).toFixed(4))
          }
        }
      })
    }
  },

  get_difficulty (cb) {
    request({ uri: base_url + 'getdifficulty', json: true }, function (error, response, body) {
      return cb(body)
    })
  },

  get_connectioncount (cb) {
    request({ uri: base_url + 'getconnectioncount', json: true }, function (error, response, body) {
      return cb(body)
    })
  },

  get_blockcount: function (cb) {
    var uri = base_url + 'getblockcount'
    request({uri: uri, json: true}, function (error, response, body) {
      return cb(body)
    })
  },

  get_blockhash: function (height, cb) {
    var uri = base_url + 'getblockhash?height=' + height
    request({uri: uri, json: true}, function (error, response, body) {
      return cb(body)
    })
  },

  get_block: function (hash, cb) {
    var uri = base_url + 'getblock?hash=' + hash
    request({uri: uri, json: true}, function (error, response, body) {
      return cb(body)
    })
  },

  get_rawtransaction: function (hash, cb) {
    var uri = base_url + 'getrawtransaction?txid=' + hash + '&decrypt=1'
    request({uri: uri, json: true}, function (error, response, body) {
      return cb(body)
    })
  },

  get_maxmoney: function (cb) {
    var uri = base_url + 'getmaxmoney'
    request({uri: uri, json: true}, function (error, response, body) {
      return cb(body)
    })
  },

  get_maxvote: function (cb) {
    var uri = base_url + 'getmaxvote'
    request({uri: uri, json: true}, function (error, response, body) {
      return cb(body)
    })
  },

  get_vote: function (cb) {
    var uri = base_url + 'getvote'
    request({uri: uri, json: true}, function (error, response, body) {
      return cb(body)
    })
  },

  get_phase: function (cb) {
    var uri = base_url + 'getphase'
    request({uri: uri, json: true}, function (error, response, body) {
      return cb(body)
    })
  },

  get_reward: function (cb) {
    var uri = base_url + 'getreward'
    request({uri: uri, json: true}, function (error, response, body) {
      return cb(body)
    })
  },

  get_estnext: function (cb) {
    var uri = base_url + 'getnextrewardestimate'
    request({uri: uri, json: true}, function (error, response, body) {
      return cb(body)
    })
  },

  get_nextin: function (cb) {
    var uri = base_url + 'getnextrewardwhenstr'
    request({uri: uri, json: true}, function (error, response, body) {
      return cb(body)
    })
  },

  // synchonous loop used to interate through an array,
  // avoid use unless absolutely neccessary
  syncLoop: function (iterations, process, exit) {
    var index = 0,
      done = false,
      shouldExit = false
    var loop = {
      next: function () {
        if (done) {
          if (shouldExit && exit) {
            exit() // Exit if we're done
          }
          return // Stop the loop if we're done
        }
          // If we're not finished
        if (index < iterations) {
          index++ // Increment our index
          if (index % 100 === 0) { // clear stack
            setTimeout(function () {
              process(loop) // Run our process, pass in the loop
            }, 1)
          } else {
            process(loop) // Run our process, pass in the loop
          }
          // Otherwise we're done
        } else {
          done = true // Make sure we say we're done
          if (exit) exit() // Call the callback on exit
        }
      },
      iteration: function () {
        return index - 1 // Return the loop number we're on
      },
      break: function (end) {
        done = true // End the loop
        shouldExit = end // Passing end as true means we still call the exit callback
      }
    }
    loop.next()
    return loop
  },

  balance_supply (cb) {
    Address.find({}, 'balance').where('balance').gt(0).exec((err, docs) =>
      cb(docs.reduce((total, doc) => total + doc.balance, 0))
    )
  },

  get_supply (cb) {
    if (settings.supply == 'HEAVY') {
      var uri = base_url + 'getsupply'
      request({uri: uri, json: true}, function (error, response, body) {
        return cb(body)
      })
    } else if (settings.supply == 'GETINFO') {
      var uri = base_url + 'getinfo'
      request({uri: uri, json: true}, function (error, response, body) {
        return cb(body.moneysupply)
      })
    } else if (settings.supply == 'BALANCES') {
      module.exports.balance_supply(function (supply) {
        return cb(supply / 100000000)
      })
    } else if (settings.supply == 'TXOUTSET') {
      var uri = base_url + 'gettxoutsetinfo'
      request({uri: uri, json: true}, function (error, response, body) {
        return cb(body.total_amount)
      })
    } else {
      coinbase_supply(function (supply) {
        return cb(supply / 100000000)
      })
    }
  },

  is_unique (array, object, cb) {
    const index = array.map(a => deepEqual(a.addresses, object)).indexOf(true)
    const ret = [index < 0, index < 0 ? null : index]
    return cb ? cb(...ret) : ret
  },

  calculate_total (vout, cb) {
    return cb(vout.reduce((total, v) => total + v.amount, 0))
  },

  prepare_vout (vout, txid, vin, cb) {
    const vouts = vout.reduce((acc, v, i) => {
      const scriptpk = v.scriptPubKey
      if (scriptpk.type !== 'nonstandard' && scriptpk.type !== 'nulldata') {
        if (module.exports.is_unique(acc, scriptpk.addresses[0])) {
          return acc.concat([ {
            addresses: [ scriptpk.addresses[0] ],
            amount: module.exports.convert_to_satoshi(parseFloat(v.value))
          } ])
        } else {
          acc[i].amount += module.exports.convert_to_satoshi(parseFloat(v.value))
          return acc
        }
      } else return acc
    }, [])
    const vins = vin
    if (vout[0].scriptPubKey.type === 'nonstandard' && vins.length && vouts.length && vins[0].addresses === vouts[0].addresses) {
      vouts[0].amount -= vins[0].amount
      vins.shift()
    }
    return cb(vouts, vins)
  },

  get_input_addresses (input, vout, cb) {
    if (input.coinbase) return cb([ { hash: 'coinbase', amount: vout.reduce((amt, v) => amt + parseFloat(v.value), 0) } ])
    return cb(module.exports.get_rawtransaction(input.txid, tx => {
      if (tx) {
        return [tx.vout
          .filter(v => v.n === input.vout)
          .map(v => v.scriptPubKey.addresses ? { hash: v.scriptPubKey[0], amount: v.value } : undefined)
          .filter(v => v !== undefined)[0]]
      }
      return undefined
    }))
  },

  prepare_vin (tx, cb) {
    return cb(tx.vin
      .reduce((arr, v, i) => module.exports.get_input_addresses(v, tx.vout, ([addr] = []) => {
        if (addr) {
          if (module.exports.is_unique(arr, addr.hash)[0]) {
            return arr.concat({ addresses: addr.hash, amount: module.exports.convert_to_satoshi(parseFloat(addr.amount)) })
          }
          arr[i].amount += module.exports.convert_to_satoshi(parseFloat(addr.amount))
        }
        return arr
      }), [])
    )
  }
}
