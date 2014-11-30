var request = require('request');

var base_url = 'https://poloniex.com/public?command=';

module.exports = {
  
  get_summary: function(coin, exchange, cb) {
    var req_url = base_url + 'returnTicker';
    var ticker = exchange + '_' + coin;
    request({uri: req_url, json: true}, function (error, response, body) {
      return cb(error, body[ticker]);
    });
  },

  get_trades: function(coin, exchange, cb) {
    var req_url = base_url + 'returnTradeHistory&currencyPair=' + exchange + '_' + coin;
    request({uri: req_url, json: true}, function (error, response, body) {
      return cb(error, body);
    });
  },

  get_orders: function(coin, exchange, cb) {
    var req_url = base_url + 'returnOrderBook&currencyPair=' + exchange + '_' + coin + '&depth=50';
    request({uri: req_url, json: true}, function (error, response, body) {
      return cb(error, body);
    });
  },

  get_chartdata: function(coin, exchange, period, cb) { 
    var end = Date.now();
    end = end / 1000;
    start = end - 86400; 
    var req_url = base_url + 'returnChartData&currencyPair=' + exchange + '_' + coin + '&start=' + start + '&end=' + end + '&period=1800';
    request({uri: req_url, json: true}, function (error, response, body) {
      return cb(error, body);
    });
  },
};