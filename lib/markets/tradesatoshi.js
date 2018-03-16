var request = require('request');

var base_url = 'https://tradesatoshi.com/api/public';

function get_summary(coin, exchange, cb) {
  var req_url = base_url + '/getmarketsummary?market=' + coin + '_' + exchange;
  request({uri: req_url, json: true}, function (error, response, body) {
    if (body.length < 1) {
      return cb('1Pair not found ' + coin + '_' + exchange, null)
    } else {
      return cb (null, body[0]);
    }
  });
}

function get_trades(coin, exchange, cb) {
  var req_url = base_url + '/getmarkethistory?market=' + coin + '_' + exchange + '&count=20';
  request({uri: req_url, json: true}, function (error, response, body) {
    if (body.length < 1) {
      return cb('2Pair not found ' + coin + '_' + exchange, null)
    } else {
      return cb (null, body[coin + '_' + exchange]);
    }
  });
}

function get_orders(coin, exchange, cb) {
  var req_url = base_url + '/getorderbook?market=' + coin + '_' + exchange + '&type=both&depth=20';
  request({uri: req_url, json: true}, function (error, response, body) {
    if (body[coin + '_' + exchange]) {
      var obj = body['true'];
      return cb(null, result.buy, result.sell);
    } else {
      return cb('3Pair not found ' + coin + '_' + exchange, [], []);
    }
  });
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