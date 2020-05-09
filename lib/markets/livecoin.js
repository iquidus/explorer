var request = require('request');
var base_url = 'https://api.livecoin.net';

function get_summary(coin, exchange, cb) {
  var summary = {};
  var req_url = base_url + '/exchange/ticker?currencyPair=' + coin.toUpperCase() + '/' + exchange.toUpperCase();
  request({uri: req_url, json: true}, function (error, response, body) {
    if (error) {
      return cb(error, null);
    } else {
        summary['bid'] = body['best_bid'];
        summary['ask'] = body['best_ask'];
        summary['volume'] = body['volume'];
        summary['high'] = body['high'];
        summary['low'] = body['low'];
        summary['last'] = body['last'];
        return cb(null, summary);
    }
  });
}

function get_trades(coin, exchange, cb) {
  var req_url = base_url + '/exchange/last_trades?currencyPair=' + coin.toUpperCase() + '/' + exchange.toUpperCase();
  request({uri: req_url, json: true}, function (error, response, body) {
    if (error) {
        return cb(error, null);
    } else {
      var tTrades = body;
      var trades = [];
      for (var i = 0; i < tTrades.length; i++) {
        var Trade = {
          ordertype: tTrades[i].type,
          amount: tTrades[i].quantity,
          price: tTrades[i].price,
            //  total: parseFloat(tTrades[i].Total).toFixed(8)
            // Necessary because API will return 0.00 for small volume transactions
          total: (tTrades[i].quantity * tTrades[i].price).toFixed(8),
          timestamp: tTrades[i].time
        }
        trades.push(Trade);
      }
      return cb(null, trades);
    }
  });
}

function get_orders(coin, exchange, cb) {
  var req_url = base_url + '/exchange/order_book?currencyPair=' + coin.toUpperCase() + '/' + exchange.toUpperCase();
  request({uri: req_url, json: true}, function (error, response, body) {
    if (error) {
        return cb(error, [], []);
    } else {
      var orders = body;
      var buys = [];
      var sells = [];
      if (orders['bids'].length > 0){
        for (var i = 0; i < orders['bids'].length; i++) {
          var order = {
            amount: parseFloat(orders.bids[i][1]).toFixed(8),
            price: parseFloat(orders.bids[i][0]).toFixed(8),
            //  total: parseFloat(orders.bids[i].Total).toFixed(8)
            // Necessary because API will return 0.00 for small volume transactions
            total: (parseFloat(orders.bids[i][1]).toFixed(8) * parseFloat(orders.bids[i][0])).toFixed(8)
          }
          buys.push(order);
        }
      } else {}

      if (orders['asks'].length > 0) {
        for (var x = 0; x < orders['asks'].length; x++) {
          var order = {
            amount: parseFloat(orders.asks[x][1]).toFixed(8),
            price: parseFloat(orders.asks[x][0]).toFixed(8),
            //    total: parseFloat(orders.asks[x].Total).toFixed(8)
            // Necessary because API will return 0.00 for small volume transactions
            total: (parseFloat(orders.asks[x][1]).toFixed(8) * parseFloat(orders.asks[x][0])).toFixed(8)
          }
          sells.push(order);
        }
      } else {}
      
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
