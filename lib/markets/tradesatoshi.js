var request = require('request');

var base_url = 'https://tradesatoshi.com/api/public/';
function get_summary(coin, exchange, cb) {
    var summary = {};
    request({ uri: base_url + 'getmarketsummary?market=' + coin + '_' + exchange, json: true }, function (error, response, body) {
        if (error) {
            return cb(error, null);
        } else {
            summary['bid'] = body.result['bid'];
            summary['ask'] = body.result['ask'];
            summary['volume'] = body.result['volume'];
            summary['high'] = body.result['high'];
            summary['low'] = body.result['low'];
            summary['last'] = body.result['last'];
            summary['change'] = body.result['change'];
            return cb(null, summary);
        }
    });
}

function get_trades(coin, exchange, cb) {
    var req_url = base_url + 'getmarkethistory?market=' + coin + '_' + exchange + '&count=1000';
    request({uri: req_url, json: true}, function (error, response, body) {
      if (body.success == true) {
          return cb (null, body['result']);
      } else {
        return cb(body.message, null);
      }
    });
  }

function get_orders(coin, exchange, cb) {
    var req_url = base_url + 'getorderbook?market=' + coin + '_' + exchange + '&type=both&depth=1000';
    request({ uri: req_url, json: true }, function (error, response, body) {
        if (body.success) {
            var orders = body.result;
            var buys = [];
            var sells = [];
            if (orders['buy'].length > 0){
                for (var i = 0; i < orders['buy'].length; i++) {
                    var order = {
                        amount: parseFloat(orders.buy[i].quantity).toFixed(8),
                        price: parseFloat(orders.buy[i].rate).toFixed(8),
                        total: (parseFloat(orders.buy[i].quantity).toFixed(8) * parseFloat(orders.buy[i].rate)).toFixed(8)
                    }
                    buys.push(order);
                }
            }
            if (orders['sell'].length > 0) {
                for (var x = 0; x < orders['sell'].length; x++) {
                    var order = {
                        amount: parseFloat(orders.sell[x].quantity).toFixed(8),
                        price: parseFloat(orders.sell[x].rate).toFixed(8),
                        total: (parseFloat(orders.sell[x].quantity).toFixed(8) * parseFloat(orders.sell[x].rate)).toFixed(8)
                    }
                    sells.push(order);
                }
            }
            return cb(null, buys, sells);
        } else {
            return cb(body.Message, [], [])
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
