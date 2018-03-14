var request = require('request');

var base_url = 'https://freiexchange.com/api';

function get_summary(coin, exchange, cb) {
  var req_url = base_url + '/public/' + coin;
  request({uri: req_url, json: true}, function (error, response, body) {
    if (error) {
      return cb(error, null);
    } else {
      if (body.message) {
        return cb(body.message, null)
      } else {
        return cb (null, body["public"]);
      }
    }
  });
}

function get_trades(coin, exchange, cb) {
  var req_url = base_url + '/trades/' + coin;
  request({uri: req_url, json: true}, function (error, response, body) {
    if (error) {
      return cb(error, null);
    } else {
      if (body.message) {
        return cb(body.message, null)
      } else {
        return cb (null, body);
      }
    }
  });
}

function get_orders(coin, exchange, cb) {
  var req_url = base_url + '/orderbook/' + coin;
  request({uri: req_url, json: true}, function (error, response, body) {
    if (body.success == 0) {
      return cb(body.error, null, null);
    } else {
      var buys = [];
      var sells= [];
      for (j in body['buy']) 
       buys.push([parseFloat(body['buy'][j].price),parseFloat(body['buy'][j].amount)]);
      for (j in body['sell']) 
       sells.push([parseFloat(body['sell'][j].price),parseFloat(body['sell'][j].amount)]);
      return cb(null, buys, sells);
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