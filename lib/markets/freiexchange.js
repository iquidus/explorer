var request = require('request');
var crypto = require('crypto');
var base_url = 'https://api.freiexchange.com';

function get_summary(coin, exchange, cb) {
  var req_url = base_url + '/public/' + coin;
  var summary = {};
  request({uri: req_url, json: true}, function (error, response, body) {
    if (error) {
      return cb(error, null);
    } else if (body.error !== true) {

     var pair = body[coin + '_' + exchange];

        summary['ask'] = parseFloat(pair[0].high).toFixed(8);
        summary['bid'] = parseFloat(pair[0].low).toFixed(8);
        summary['volume'] = parseFloat(pair[0].volume24h).toFixed(8);
        summary['volume_btc'] = parseFloat(pair[0].volume24h_btc).toFixed(8);
        summary['low'] = parseFloat(pair[0].highestBuy).toFixed(8);
        summary['high'] = parseFloat(pair[0].lowestSell).toFixed(8);
        summary['last'] = parseFloat(pair[0].last).toFixed(8);
        summary['change'] = parseFloat(pair[0].percent_change_24h);
      return cb(null, summary);
    } else {
      return cb(error, null);
    }
  });
}

function get_trades(coin, exchange, cb) {
  var req_url = base_url + '/trades/' + coin;
  request({ uri: req_url, json: true }, function (error, response, body) {
        if(error)
          return cb(error, null);
        else if (body.error !== true) {
          var tTrades = body;
          var trades = [];
          for (var i = 0; i < tTrades.length; i++) {
              var Trade = {
                  ordertype: tTrades[i].type,
                  amount: parseFloat(tTrades[i].total_coin).toFixed(8),
                  price: parseFloat(tTrades[i].price).toFixed(8),
                  total: (parseFloat(tTrades[i].total_coin).toFixed(8) * parseFloat(tTrades[i].price)).toFixed(8),
                  timestamp: formatTime(tTrades[i].time)
              }
              trades.push(Trade);
          }
          return cb(null, trades);
      } else {
          return cb(body.Message, null);
      }
  });
}

function formatTime(timestamp){
    var raw = new Date(timestamp)
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var year = raw.getFullYear();
    var month = months[raw.getMonth()];
    var date = raw.getDate();
    var hour = raw.getHours();
    var min = raw.getMinutes();
    var sec = raw.getSeconds();
    var time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec ;
    return time;
}

function get_orders(coin, exchange, cb) {
  var req_url = base_url + '/orderbook/' + coin;
    request({ uri: req_url, json: true }, function (error, response, body) {
        if(error)
            return cb(error, null);
        else if (body.error !== true) {
            var buyorders = body['BUY'];
            var sellorders = body['SELL'];

            var buys = [];
            var sells = [];
            if (buyorders.length > 0){
                for (var i = 0; i < buyorders.length; i++) {
                    var order = {
                        amount: parseFloat(buyorders[i].amount).toFixed(8),
                        price: parseFloat(buyorders[i].price).toFixed(8),
                        total: (parseFloat(buyorders[i].amount).toFixed(8) * parseFloat(buyorders[i].price)).toFixed(8)
                    }
                    buys.push(order);
                }
                } else {}
                if (sellorders.length > 0) {
                for (var x = 0; x < sellorders.length; x++) {
                    var order = {
                        amount: parseFloat(sellorders[x].amount).toFixed(8),
                        price: parseFloat(sellorders[x].price).toFixed(8),
                        total: (parseFloat(sellorders[x].amount).toFixed(8) * parseFloat(sellorders[x].price)).toFixed(8)
                    }
                    sells.push(order);
                }
            } else {
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
        get_summary(settings.coin, settings.exchange,  function(err, stats) {
          if (err) { error = err; }
          return cb(error, {buys: buys, sells: sells, chartdata: [], trades: trades, stats: stats});
        });
      });
    });
  }
};