var request = require('request');

var base_url = 'https://tradesatoshi.com/api/public/';

function get_summary(coin, exchange, cb) {
  var req_url = base_url + 'getticker?market=' + coin + '_' + exchange;
  request({uri: req_url, json: true}, function (error, response, body) {
    if (error) {
      return cb(error, null);
    } else {
      if (body.message) {
        return cb(body.message, null)
      } else {
        //return cb (null, body[coin + '_' + exchange]);
        return cb (null, body);
      }
    }
  });
}

function get_trades(coin, exchange, cb) {
  var req_url = base_url + 'getmarkethistory?market=&count=20' + coin + '_' + exchange + '&count=20';
  request({uri: req_url, json: true}, function (error, response, body) {
    if (error) {
      return cb(error, null);
    } else {
      if (body.message) {
        return cb(body.message, null)
      } else {
        //return cb (null, body[coin + '_' + exchange]);
        return cb (null, body);
      }
    }
  });
}

function get_orders(coin, exchange, cb) {
  var req_url = base_url + 'getorderbook?market=' + coin + '_' + exchange + '&type=both&depth=20';
  request({uri: req_url, json: true}, function (error, response, body) {
    if (body.success == 0) {
      return cb('Pair not found ' + body.error, null, null);
    } else {
      return cb(null, body['result']['buy'], body[''result]['sell']);
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