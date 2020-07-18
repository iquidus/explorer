var request = require('request');

var base_url = 'https://altmarkets.io/api/v2/';

function get_summary(coin, exchange, cb) {
  var req_url = base_url + 'tickers/' + coin.toLowerCase() + exchange.toLowerCase();
  var summary = {};
  request({uri: req_url, json: true}, function (error, response, body) {
    if (error) {
      return cb(error, null);
    } else {
      if (body.error) {
        return cb(body.error, null);
      } else {
        summary['bid'] = parseFloat(body['ticker']['buy']).toFixed(8);
        summary['ask'] = parseFloat(body['ticker']['sell']).toFixed(8);
        summary['volume'] = parseFloat(body['ticker']['vol']).toFixed(8);
        summary['volume_btc'] = parseFloat(body['ticker']['quote_volume']).toFixed(8);
        summary['high'] = parseFloat(body['ticker']['high']).toFixed(8);
        summary['low'] = parseFloat(body['ticker']['low']).toFixed(8);
        summary['last'] = parseFloat(body['ticker']['last']).toFixed(8);
        summary['change'] = 0;
        request({ uri: base_url + 'currency/trades?currency=' + coin.toLowerCase(), json: true }, function (error, response, body) {
          if (error) {
            return cb(null, summary);
          } else {
            if (body.error) {
              return cb(null, summary);
            } else {
              summary['change'] = 0;
              for (var i = 0; i < body.length; i++) {
                if (exchange.toLowerCase() in body[i]) {
                  summary['change'] = parseFloat(body[i][exchange.toLowerCase()]['change']);
                  break;
                }
              }
              return cb(null, summary);
            }
          }
        });
      }
    }
  });
}

function get_trades(coin, exchange, cb) {
  var req_url = base_url + "trades?market=" + coin.toLowerCase() + "" + exchange.toLowerCase() + "&limit=50&order_by=desc";
  request({uri: req_url, json: true}, function (error, response, body) {
    if (body.error) {
      return cb(body.error, null);
    } else {
      return cb (null, body);
    }
  });
}

function get_orders(coin, exchange, cb) {
  var req_url = base_url + 'depth?market=' + coin.toLowerCase() + exchange.toLowerCase();
  request({uri: req_url, json: true}, function (error, response, body) {
    if (body.error) {
      return cb(body.error, [], [])
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
      var sells = sells.reverse();
      return cb(null, buys, sells);
    }
  });
}

function get_chartdata(coin, exchange, cb) { 
  var end = Date.now();
  end = end / 1000;
  start = end - 86400;
  var req_url = base_url + 'k/?market=' + coin.toLowerCase() + "" + exchange.toLowerCase() + '&time_from=' + start + '&time_to=' + end + '&period=1';
  request({uri: req_url, json: true}, function (error, response, chartdata) {
    if (error) {
      return cb(error, []);
    } else {
      if (chartdata.error == null) {
        var processed = [];
        for (var i = 0; i < chartdata.length; i++) {
          processed.push([chartdata[i][0] * 1000, parseFloat(chartdata[i][1]), parseFloat(chartdata[i][2]), parseFloat(chartdata[i][3]), parseFloat(chartdata[i][4])]);
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
    var error = null;
    get_chartdata(coin, exchange, function (err, chartdata){
      if (err) { chartdata = []; error = err; }
      get_orders(coin, exchange, function(err, buys, sells) {
        if (err) { error = err; }
        get_trades(coin, exchange, function(err, trades) {
          if (err) { error = err; }
          get_summary(coin, exchange, function(err, stats) {
            if (err) { error = err; }
            return cb(error, {buys: buys, sells: sells, chartdata: chartdata, trades: trades, stats: stats});
          });
        });
      });
    });
  }
};
