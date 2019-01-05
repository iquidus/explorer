var request = require('request');

var base_url = 'https://api.palitanx.com/v1/';

//
//  Get Market From GravieX
//
function get_summary(coin, exchange, cb) {
  var summary = {};
  var url=base_url + 'public/getmarketsummary/' + exchange.concat('-'+coin).toUpperCase();
  //console.log("send request to - " + url)
  request({uri: url, json: true}, function (error, response, body) {
    if (error) {
      return cb(error, null);
    } else if (body.success == true) {
      body['result'] = body['result'][0]
      summary['ask'] = parseFloat(body['result']['Ask']).toFixed(8);
      summary['bid'] = parseFloat(body['result']['Bid']).toFixed(8);
      summary['volume'] = parseFloat(body['result']['Volume']).toFixed(8);
      summary['volume_btc'] = parseFloat(body['result']['BaseVolume']).toFixed(8);
      summary['high'] = parseFloat(body['result']['High']).toFixed(8);
      summary['low'] = parseFloat(body['result']['Low']).toFixed(8);
      summary['last'] = parseFloat(body['result']['Last']).toFixed(8);
      summary['change'] = parseFloat(0);
      return cb(null, summary);
    } else {
      return cb(error, null);
    }
  });   
}
// Get Trades
function get_trades(coin, exchange, cb) {
  var req_url = base_url + 'public/getmarkethistory/' + exchange.concat('-'+coin).toUpperCase();
  //console.log("send request to - " + req_url)
  request({ uri: req_url, json: true }, function (error, response, body) {
        if(error)
          return cb(error, null);
        else if (body.success == true) {
          var tTrades = body.result;
          var trades = [];
          for (var i = 0; i < tTrades.length; i++) {
              var Trade = {
                  orderpair: exchange.concat('-'+coin).toUpperCase(),
                  ordertype: tTrades[i].OrderType,
                  amount: parseFloat(tTrades[i].Quantity).toFixed(8),
                  price: parseFloat(tTrades[i].Price).toFixed(8),
                  //  total: parseFloat(tTrades[i].Total).toFixed(8)
                  // Necessary because API will return 0.00 for small volume transactions
                  total: (parseFloat(tTrades[i].Quantity).toFixed(8) * parseFloat(tTrades[i].Price)).toFixed(8),
                  timestamp: parseInt((new Date(tTrades[i].TimeStamp).getTime() / 1000).toFixed(0))
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
    var req_url = base_url + 'public/getorderbook/' + exchange.concat('-'+coin).toUpperCase() + '/both';
    //console.log("send request to - " + req_url)
    request({ uri: req_url, json: true }, function (error, response, body) {
        if(error)
            return cb(error, null);
        else if (body.success == true) {
            var buyorders = body.result['buy'];
            var sellorders = body.result['sell'];
            
            var buys = [];
            var sells = [];
            if (buyorders.length > 0){
                for (var i = 0; i < buyorders.length; i++) {
                    var order = {
                        amount: parseFloat(buyorders[i].Quantity).toFixed(8),
                        price: parseFloat(buyorders[i].Rate).toFixed(8),
                        //  total: parseFloat(orders.BuyOrders[i].Total).toFixed(8)
                        // Necessary because API will return 0.00 for small volume transactions
                        total: (parseFloat(buyorders[i].Quantity).toFixed(8) * parseFloat(buyorders[i].Rate)).toFixed(8)
                    }
                    buys.push(order);
                }
                //console.log("Buy orders: %j", buys);
                } else {

                }
                if (sellorders.length > 0) {
                for (var x = 0; x < sellorders.length; x++) {
                    var order = {
                        amount: parseFloat(sellorders[x].Quantity).toFixed(8),
                        price: parseFloat(sellorders[x].Rate).toFixed(8),
                        //    total: parseFloat(orders.SellOrders[x].Total).toFixed(8)
                        // Necessary because API will return 0.00 for small volume transactions
                        total: (parseFloat(sellorders[x].Quantity).toFixed(8) * parseFloat(sellorders[x].Rate)).toFixed(8)
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
      //console.log(buys, sells)
     if (err) { error = err; }
      get_trades(coin, exchange, function(err, trades) {
        if (err) { error = err; }
        get_summary(coin, exchange,  function(err, stats) {
          if (err) { error = err; }
          return cb(error, {buys: buys, sells: sells, chartdata: [], trades: trades, stats: stats});
        });
      });
    });
  }
};
