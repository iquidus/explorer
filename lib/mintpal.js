var request = require('request');

var base_url = 'https://api.mintpal.com/market';

function getStats (coin, exchange, cb) {
  var req_url = base_url + '/stats/' + coin + '/' + exchange;
  request({uri: req_url, json: true}, function (error, response, body) {
    if (error) {
      return cb(error, body);
    } else {
      return cb(null, body[0]);
    }
  });
}
module.exports = {
//Stats
  get_stats: function(coin, exchange, cb) {
    getStats(coin, exchange, function(error, stats) {
      return cb(error, stats);
    });
  },
//Trades
  get_trades: function(coin, exchange, cb) {
    var req_url = base_url + '/trades/' + coin + '/' + exchange;
    request({uri: req_url, json: true}, function (error, response, body) {
      if (error) {
        return cb(error, body);
      } else {
        return cb(null, body);
      }
    });
  },
//Orders
  get_orders: function(coin, exchange, type, cb) {
    var req_url = base_url + '/orders/' + coin + '/' + exchange + '/' + type;
    request({uri: req_url, json: true}, function (error, response, body) {
      if (error) {
        return cb(error, body);
      } else {
        return cb(null, body);
      }
    });
  },


//Chart Data
  get_chartdata: function(coin, exchange, period, cb) {
    getStats(coin, exchange, function (error, stats) {
      if (error) {
        return(error, stats);
      } else {
        if (stats.error == null) {
          var req_url = base_url + '/chartdata/' + stats.market_id + '/' + period;
          request({uri: req_url, json: true}, function (error, response, body) {
            if (error) {
              return cb(error, body);
            } else {
              return cb(null, body);
            }
          });
        } else {
          return cb(error, stats);
        }
      }
    });
  },
};