var request = require('request');

var base_url = 'https://poloniex.com/public?command=';
  
function get_summary(coin, exchange, cb) {
  var req_url = base_url + 'returnTicker';
  var ticker = exchange + '_' + coin;
  request({uri: req_url, json: true}, function (error, response, body) {
    return cb(error, body[ticker]);
  });
}

function get_trades(coin, exchange, cb) {
  var req_url = base_url + 'returnTradeHistory&currencyPair=' + exchange + '_' + coin;
  request({uri: req_url, json: true}, function (error, response, body) {
    return cb(error, body);
  });
}

function get_orders(coin, exchange, cb) {
  var req_url = base_url + 'returnOrderBook&currencyPair=' + exchange + '_' + coin + '&depth=50';
  request({uri: req_url, json: true}, function (error, response, body) {
    return cb(error, body);
  });
}

function get_chartdata(coin, exchange, cb) { 
  var end = Date.now();
  end = end / 1000;
  start = end - 86400; 
  var req_url = base_url + 'returnChartData&currencyPair=' + exchange + '_' + coin + '&start=' + start + '&end=' + end + '&period=1800';
  request({uri: req_url, json: true}, function (error, response, chartdata) {
    if (error) {
      return cb(error, []);
    } else {
      if (chartdata.error == null) {
        var processed = [];
        for (var i = 0; i < chartdata.length; i++) {
          processed.push([chartdata[i].date * 1000, parseFloat(chartdata[i].open), parseFloat(chartdata[i].high), parseFloat(chartdata[i].low), parseFloat(chartdata[i].close)]);
          if (i == chartdata.length - 1) {
            return cb(null, processed);
          }
        }
      } else {
        return cb(chartdata.error, []);
      }
    }
  });
}

module.exports = {
  get_data: function(coin, exchange, cb) {
    get_chartdata(coin, exchange, function (error, chartdata){
      if (error) {
        chartdata = [];
      }
      get_orders(coin, exchange, function (error, orders){
        var buys = [];
        var sells = [];
        if (orders.bids) {
          buys = orders.bids;
          sells = orders.asks;
        } 
        get_trades(coin, exchange, function (error, trades){
          get_summary(coin, exchange, function (error, stats){
            return cb({buys: buys, sells: sells, chartdata: chartdata, trades: trades, stats: stats});
          });
        });
      });
    });
  }
};