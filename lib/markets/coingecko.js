var request = require('request');

var base_url = 'https://api.coingecko.com/api/v3';

function get_summary(coin, exchange, cb) {
  var req_url = base_url + '/simple/price?ids=' + coin + '&vs_currencies=' + exchange;
  request({uri: req_url, json: true}, function (error, response, body) {
    if (error) {
      return cb(error, null);
    } else {
      if (body.error) {
        return cb(body.error, null)
      } else {
        return cb (null, {"last": body[coin][exchange.toLowerCase()]});
      }
    }
  });
}

function get_trades(coin, exchange, cb) {
  // not implemented yet
  return cb(null, [], []);
}

function get_orders(coin, exchange, cb) {
  // not implemented yet
  return cb(null, [], []);
}

module.exports = {
  get_data: function(coin, exchange, cb) {
    var error = null;
    get_orders(coin, exchange, function(err, buys, sells) {
      if (err) { error = err; }
      get_trades(coin, exchange, function(err, trades) {
        if (err) { error = err; }
        get_summary(coin, exchange, function(err, stats) {
          if (err) { error = err; }
          return cb(error, {buys: buys, sells: sells, chartdata: [], trades: trades, stats: stats});
        });
      });
    });
  }
};
