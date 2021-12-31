var request = require('request');

var base_url = 'https://v2.altmarkets.io/api/v2/peatio/public/markets/';

function get_summary(coin, exchange, cb) {
  var req_url = base_url + coin.toLowerCase() + exchange.toLowerCase() + '/tickers/';
  var summary = {};
  request({uri: req_url, json: true}, function (error, response, body) {
    if (error) {
      return cb(error, null);
    } else {
      if (body.error) {
        return cb(body.error, null);
      } else {
        summary['volume'] = parseFloat(body['ticker']['amount']).toFixed(8);
        summary['volume_btc'] = parseFloat(body['ticker']['volume']).toFixed(8);
        summary['high'] = parseFloat(body['ticker']['high']).toFixed(8);
        summary['low'] = parseFloat(body['ticker']['low']).toFixed(8);
        summary['last'] = parseFloat(body['ticker']['last']).toFixed(8);
        summary['change'] = parseFloat(body['ticker']['price_change_percent']).toFixed(8);
        return cb(null, summary);
      }
    }
  });
}

function get_trades(coin, exchange, cb) {
  var req_url = base_url + coin.toLowerCase() + exchange.toLowerCase() + '/trades/?limit=50&order_by=desc';
  request({uri: req_url, json: true}, function (error, response, body) {
    if (body.error) {
      return cb(body.error, null);
    } else {
      return cb (null, body);
    }
  });
}

function get_orders(coin, exchange, cb) {
  var req_url = base_url + coin.toLowerCase() + exchange.toLowerCase() + '/order-book/';
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
            amount: parseFloat(orders.bids[i].remaining_volume).toFixed(8),
            price: parseFloat(orders.bids[i].price).toFixed(8),
            //  total: parseFloat(orders.bids[i].Total).toFixed(8)
            // Necessary because API will return 0.00 for small volume transactions
            total: (parseFloat(orders.bids[i].remaining_volume).toFixed(8) * parseFloat(orders.bids[i].price)).toFixed(8)
          }
          buys.push(order);
        }
      } else {}
      if (orders['asks'].length > 0) {
        for (var x = 0; x < orders['asks'].length; x++) {
          var order = {
            amount: parseFloat(orders.asks[x].remaining_volume).toFixed(8),
            price: parseFloat(orders.asks[x].price).toFixed(8),
            //    total: parseFloat(orders.asks[x].Total).toFixed(8)
            // Necessary because API will return 0.00 for small volume transactions
            total: (parseFloat(orders.asks[x].remaining_volume).toFixed(8) * parseFloat(orders.asks[x].price)).toFixed(8)
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
  end = parseInt(end / 1000);
  start = end - 86400;
  var req_url = base_url + coin.toLowerCase() + exchange.toLowerCase() + '/k-line/?time_from=' + start + '&time_to=' + end + '&period=1';
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
  get_data: function(settings, cb) {
    var error = null;
    get_chartdata(settings.coin, settings.exchange, function (err, chartdata){
      if (err) { chartdata = []; error = err; }
      get_orders(settings.coin, settings.exchange, function(err, buys, sells) {
        if (err) { error = err; }
        get_trades(settings.coin, settings.exchange, function(err, trades) {
          if (err) { error = err; }
          get_summary(settings.coin, settings.exchange, function(err, stats) {
            if (err) { error = err; }
            return cb(error, {buys: buys, sells: sells, chartdata: chartdata, trades: trades, stats: stats});
          });
        });
      });
    });
  }
};
