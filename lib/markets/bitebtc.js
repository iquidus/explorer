var request = require('request');

var base_url = 'https://bitebtc.com/api/v1/';
function get_summary(coin, exchange, cb) {
    var summary = {};
    request({ uri: base_url + 'market=' + coin + '_' + exchange, json: true }, function (error, response, body) {
        if (error) {
            return cb(error, null);
        } else {
            summary['bid'] = body.result['average'];
            summary['ask'] = body.result['open'];
            summary['volume'] = body.result['volume'];
            summary['high'] = body.result['high'];
            summary['low'] = body.result['low'];
            summary['last'] = body.result['price'];
            summary['change'] = body.result['percent'];
            return cb(null, summary);
        }
    });
}

function get_trades(coin, exchange, cb) {
    var req_url = base_url + 'history?market=' + exchange + '_' + coin + '&count=100';
    request({uri: req_url, json: true}, function (error, response, body) {
      if (body.success == true) {
          return cb (null, body);
      } else {
        return cb(body.message, null);
      }
    });
  }

function get_orders(coin, exchange, cb) {
    var req_url = base_url + 'orders?market=' + exchange + '_' + coin + '&count=100';
    request({ uri: req_url, json: true }, function (error, response, body) {
        if (body.success) {
            //var body = body.result;
            var buy = [];
            var sell = [];
            if (body['buy'].length > 0){
                for (var i = 0; i < body['buy'].length; i++) {
                    var order = {
                        amount: parseFloat(body.buy[i].amount),
                        price: parseFloat(body.buy[i].price),
                        total: (parseFloat(body.buy[i].amount * parseFloat(body.buy[i].price)
                    }
                    buy.push(order);
                }
            }
            if (body['sell'].length > 0) {
                for (var x = 0; x < body['sell'].length; x++) {
                    var order = {
                        amount: parseFloat(body.sell[i].amount),
                        price: parseFloat(body.sell[i].price),
                        total: (parseFloat(body.sell[i].amount) * parseFloat(body.sell[i].price)
                    }
                    sell.push(order);
                }
            }
            return cb(null, buy, sell);
        } else {
            return cb(body.Message, [], [])
        }
    });
}

module.exports = {
    get_data: function(coin, exchange, cb) {
      var error = null;
          get_summary(coin, exchange, function(err, stats) {
            if (err) { error = err; }
            return cb(error, {buys: bid, sells: ask, chartdata: [], trades: trades, stats: stats});
          });
        });
      });
    }
  };