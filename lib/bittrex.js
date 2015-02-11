var request = require('request');

var base_url = 'https://bittrex.com/api/v1.1/public';

module.exports = {
//Summary: exchange = BTC, LTC or "".
  get_summary: function(coin, exchange, cb) {
    var req_url = base_url + '/getmarketsummary?market=' + exchange + '-' + coin;
    request({uri: req_url, json: true}, function (error, response, body) {
      if (error) {
        console.log(error);
        return cb(error, null);
      } else {
        if (body.message) {
          console.log(body.message);
          return cb(body.message, null)
        } else {
          return cb (null, body.result[0]);
        }
      }
    });
  },

  get_history: function(coin, exchange, cb) {
    var req_url = base_url + '/getmarkethistory?market=' + exchange + '-' + coin + '&count=50';
    request({uri: req_url, json: true}, function (error, response, body) {
      if (error) {
        console.log(error);
        return cb(error, null);
      } else {
        if (body.message) {
          console.log(body.message);
          return cb(body.message, null)
        } else {
          return cb (null, body.result);
        }
      }
    });
  },

  get_orders: function(coin, exchange, cb) {
    var req_url = base_url + '/getorderbook?market='  + exchange + '-' + coin + '&type=both' + '&depth=50';
    request({uri: req_url, json: true}, function (error, response, body) {
      if (error) {
        console.log(error);
        return cb(error, null);
      } else {
        console.log(body.message);
        return cb (null, body.result);
      }
    });
  },
};