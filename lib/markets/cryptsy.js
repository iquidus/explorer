var request = require('request');

var base_url = 'https://api.cryptsy.com/api/v2/markets';
function get_summary(coin, exchange, Crymktid, cb) {
  var summary = {};
  request({uri: base_url + '/' + Crymktid + '/ticker', json: true}, function (error, response, body) {
    if (error) {
      return cb(error, null);
    } else if (body.success === true) {
      summary['bid'] = body.data['bid'].toFixed(8);
      summary['ask'] = body.data['ask'].toFixed(8);
      request({uri: base_url + '/' + Crymktid, json: true}, function (error, response, body) {
        if (error) {
          return cb(error, null);
        } else if (body.success === true) {
          summary['volume'] = body.data['24hr']['volume'];
          summary['volume_btc'] = body.data['24hr']['volume_btc'];
          summary['high'] = body.data['24hr']['price_high'];
          summary['low'] = body.data['24hr']['price_low'];
          summary['last'] = body.data['last_trade']['price'];
          return cb(null, summary);
        } else {
          return cb(error, null);      
        }
      });
    } else {
      return cb(error, null);
    }
  });   
}
function get_trades(coin, exchange, Crymktid, cb) {
  var req_url = base_url + '/' + Crymktid + '/tradehistory?limit=100';
  request({uri: req_url, json: true}, function (error, response, body) {
    if (body.success == true) {
      return cb (null, body.data);
    } else {
      return cb(body.message, null);
    }
  });
}

function get_orders(coin, exchange, Crymktid, cb) {
  var req_url = base_url + '/' + Crymktid + '/orderbook?type=both?limit=50';
  request({uri: req_url, json: true}, function (error, response, body) {
    if (body.success == true) {
      var orders = body.data;
      var buys = [];
      var sells = [];
            if (orders['buyorders'].length > 0){
                for (var i = 0; i < orders['buyorders'].length; i++) {
                    var order = {
                        amount: parseFloat(orders.buyorders[i].quantity).toFixed(8),
                        price: parseFloat(orders.buyorders[i].price).toFixed(8),
                        //  total: parseFloat(orders.buyorders[i].total).toFixed(8)
                        // Necessary because API will return 0.00 for small volume transactions
                        total: (parseFloat(orders.buyorders[i].quantity).toFixed(8) * parseFloat(orders.buyorders[i].price)).toFixed(8)
                    }
                    buys.push(order);
                }
                } else {}
                if (orders['sellorders'].length > 0) {
                for (var x = 0; x < orders['sellorders'].length; x++) {
                    var order = {
                        amount: parseFloat(orders.sellorders[x].quantity).toFixed(8),
                        price: parseFloat(orders.sellorders[x].price).toFixed(8),
                        //    total: parseFloat(orders.sellorders[x].total).toFixed(8)
                        // Necessary because API will return 0.00 for small volume transactions
                        total: (parseFloat(orders.sellorders[x].quantity).toFixed(8) * parseFloat(orders.sellorders[x].price)).toFixed(8)
                    }
                    sells.push(order);
                }
            } else {
            }
            return cb(null, buys, sells);
            } else {
            return cb(body.message, [], [])
        }
    });
}

module.exports = {
  get_data: function(coin, exchange, Crymktid, cb) {
    var error = null;
    get_orders(coin, exchange, Crymktid, function(err, buys, sells) {
      if (err) { error = err; }
      get_trades(coin, exchange, Crymktid, function(err, trades) {
        if (err) { error = err; }
        get_summary(coin, exchange, Crymktid, function(err, stats) {
          if (err) { error = err; }
          return cb(error, {buys: buys, sells: sells, chartdata: [], trades: trades, stats: stats});
        });
      });
    });
  }
};
