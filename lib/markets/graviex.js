var request = require('request');

var base_url = 'https://graviex.net/api/v2';

//
//  Get Market From GravieX
//
function get_summary(coin, exchange, cb) {
  var summary = {};
  var url=base_url + '/tickers/' + coin.concat(exchange).toLowerCase() + ".json";
  request({uri: url, json: true}, function (error, response, body) {
    if (error) {
      return cb(error, null);
    } else if (body.error !== true) {
      summary['ask'] = parseFloat(body['ticker']['buy']).toFixed(8);
      summary['bid'] = parseFloat(body['ticker']['sell']).toFixed(8);
      summary['volume'] = parseFloat(body['ticker']['vol']).toFixed(8);
      summary['volume_btc'] = parseFloat(body['ticker']['volbtc']).toFixed(8);
      summary['high'] = parseFloat(body['ticker']['high']).toFixed(8);
      summary['low'] = parseFloat(body['ticker']['low']).toFixed(8);
      summary['last'] = parseFloat(body['ticker']['last']).toFixed(8);
      summary['change'] = parseFloat(body['ticker']['change']);
      return cb(null, summary);
    } else {
      return cb(error, null);
    }
  });   
}
// Get Trades
function get_trades(coin, exchange, cb) {
  var req_url = base_url + '/trades.json?market=' + coin.concat(exchange).toLowerCase();
  //console.log("send request to - " + req_url)
  request({ uri: req_url, json: true }, function (error, response, body) {
        if(error)
          return cb(error, null);
        else if (body.error !== true) {
          var tTrades = body;
          var trades = [];
          for (var i = 0; i < tTrades.length; i++) {
              var Trade = {
                  orderpair: tTrades[i].market,
                  ordertype: tTrades[i].side,
                  amount: parseFloat(tTrades[i].volume).toFixed(8),
                  price: parseFloat(tTrades[i].price).toFixed(8),
                  //  total: parseFloat(tTrades[i].Total).toFixed(8)
                  // Necessary because API will return 0.00 for small volume transactions
                  total: (parseFloat(tTrades[i].volume).toFixed(8) * parseFloat(tTrades[i].price)).toFixed(8),
                  timestamp: parseInt((new Date(tTrades[i].created_at).getTime() / 1000).toFixed(0))
              }
              trades.push(Trade);
          }
          //console.log("Buy orders: %j", trades);
          return cb(null, trades);
      } else {
          return cb(body.Message, null);
      }
  });
}


//Get Orders
function get_orders(coin, exchange, cb) {
    var req_url = base_url + '/order_book.json?market=' + coin.concat(exchange).toLowerCase();
    //console.log("send request to - " + req_url)
    request({ uri: req_url, json: true }, function (error, response, body) {
        if(error)
            return cb(error, null);
        else if (body.error !== true) {
            var buyorders = body['bids'];
            var sellorders = body['asks'];
            
            //console.log('Buy orders: ' + buyorders);
            //console.log('Sell orders: ' + sellorders);

            var buys = [];
            var sells = [];
            if (buyorders.length > 0){
                for (var i = 0; i < buyorders.length; i++) {
                    var order = {
                        amount: parseFloat(buyorders[i].volume).toFixed(8),
                        price: parseFloat(buyorders[i].price).toFixed(8),
                        //  total: parseFloat(orders.BuyOrders[i].Total).toFixed(8)
                        // Necessary because API will return 0.00 for small volume transactions
                        total: (parseFloat(buyorders[i].volume).toFixed(8) * parseFloat(buyorders[i].price)).toFixed(8)
                    }
                    buys.push(order);
                }
                //console.log("Buy orders: %j", buys);
                } else {}
                if (sellorders.length > 0) {
                for (var x = 0; x < sellorders.length; x++) {
                    var order = {
                        amount: parseFloat(sellorders[x].volume).toFixed(8),
                        price: parseFloat(sellorders[x].price).toFixed(8),
                        //    total: parseFloat(orders.SellOrders[x].Total).toFixed(8)
                        // Necessary because API will return 0.00 for small volume transactions
                        total: (parseFloat(sellorders[x].volume).toFixed(8) * parseFloat(sellorders[x].price)).toFixed(8)
                    }
                    sells.push(order);
                }
                //console.log("Sell orders: %j", sells);
            } else {
            }
            return cb(null, buys, sells);
            } else {
            return cb(body.Message, [], [])
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
        get_summary(coin, exchange,  function(err, stats) {
          if (err) { error = err; }
          //return cb(error, {buys: buys, sells: sells, chartdata: [], trades: trades, stats: stats});
          return cb(error, {buys: buys, sells: sells, chartdata: [], trades: trades, stats: stats});
        });
      });
    });
  }
};
