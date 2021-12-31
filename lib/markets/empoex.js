var request = require('request');

var base_url = 'https://api.empoex.com';

function get_summary(coin, exchange, cb) {
  var req_url = base_url + '/marketinfo/' + coin + '-' + exchange;
  request({uri: req_url, json: true}, function (error, response, body) {
    if (body.length < 1) {
      return cb('Pair not found ' + coin + '-' + exchange, null)
    } else {
      return cb (null, body[0]);
    }
  });
}

function get_trades(coin, exchange, cb) {
  var req_url = base_url + '/markethistory/' + coin + '-' + exchange;
  request({uri: req_url, json: true}, function (error, response, body) {
    if (body.length < 1) {
      return cb('Pair not found ' + coin + '-' + exchange, null)
    } else {
      return cb (null, body[coin + '-' + exchange]);
    }
  });
}

function get_orders(coin, exchange, cb) {
  var req_url = base_url + '/orderbook/' + coin + '-' + exchange;
  request({uri: req_url, json: true}, function (error, response, body) {
    if (body[coin + '-' + exchange]) {
      var obj = body[coin + '-' + exchange];
      return cb(null, obj.buy, obj.sell);
    } else {
      return cb('Pair not found ' + coin + '-' + exchange, [], []);
    }
  });
}

module.exports = {
  get_data: function(settings, cb) {
    var error = null;
    get_orders(settings.coin, settings.exchange, function(err, buys, sells) {
      if (err) { error = err; }
      get_trades(settings.coin, settings.exchange, function(err, trades) {
        if (err) { error = err; }
        get_summary(settings.coin, settings.exchange, function(err, stats) {
          if (err) { error = err; }
          return cb(error, {buys: buys, sells: sells, chartdata: [], trades: trades, stats: stats});
        });
      });
    });
  }
};