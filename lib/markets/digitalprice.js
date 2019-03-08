"use strict";
var request = require('request');

var base_url = 'https://digitalprice.io/api';

function get_summary(coin, exchange, cb) {
  var req_url = base_url + '/markets?baseMarket=' + exchange;
  var summary = {};
  request({uri: req_url, json: true}, function (error, response, body) {
    if (error) {
      return cb(error, null);
    } else {
      if (!body.success) {
        return cb(error, null);
      } else {
        for (let element of body.data) {
            if (element.url == coin + '-' + exchange) {
                summary['bid'] = parseFloat(element.bidHigh).toFixed(8);
                summary['ask'] = parseFloat(element.askLow).toFixed(8);
                summary['volume'] = parseFloat(element.volumeQuote);
                summary['volume_btc'] = parseFloat(element.volumeBase);
                summary['high'] = parseFloat(element.priceHigh).toFixed(8);
                summary['low'] = parseFloat(element.priceLow).toFixed(8);
                summary['last'] = parseFloat(element.priceLast).toFixed(8);
                return cb (null, summary);
                break;
            }
        }
        return cb(error, null);
      }
    }
  });
}

function get_trades(coin, exchange, cb) {
  return cb('', null);
}

function get_orders(coin, exchange, cb) {
  return cb('', null);
}

module.exports = {
  get_data: function(coin, exchange, cb) {
    var error = null;
    get_summary(coin, exchange, function(err, stats) {
      if (err) { error = err; }
      return cb(error, {buys: [], sells: [], chartdata: [], trades: [], stats: stats});
    });
  }
};

