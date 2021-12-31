var request = require('request');
var crypto = require('crypto');
//var settings = require('./settings-market-example.json');
var base_url = 'https://node1.fides-ex.com';

//
//  Get Market From Fides-ex
//
function get_summary(coin, exchange, cb) {
  var summary = {};
  var url=base_url + '/market/get-market-summary/' + exchange.toUpperCase() + "_" + coin.toUpperCase();

  request({uri: url, json: true}, function (error, response, body) {
    if (error) {
      return cb(error, null);
    } else if (body.error !== true) {
      summary['ask'] = parseFloat(body['data']['LowestAsk']).toFixed(8);
      summary['bid'] = parseFloat(body['data']['HeighestBid']).toFixed(8);
      summary['volume'] = parseFloat(body['data']['QuoteVolume']).toFixed(8);
      summary['volume_btc'] = parseFloat(body['data']['BaseVolume']).toFixed(8);
      summary['high'] = parseFloat(body['data']['High_24hr']).toFixed(8);
      summary['low'] = parseFloat(body['data']['Low_24hr']).toFixed(8);
      summary['last'] = parseFloat(body['data']['Last']).toFixed(8);
      summary['change'] = parseFloat(body['data']['PercentChange']);
      return cb(null, summary);
    } else {
      return cb(error, null);
    }
  });   
}
// Get Trades
function get_trades(coin, exchange, cb) {
  var req_url=base_url + '/market/get-trade-history/' + exchange.toUpperCase() + "_" + coin.toUpperCase();
  request({uri: req_url, json: true}, function (error, response, body) {
    if (body.error) {
      return cb(body.error, []);
    } else {
      return cb(null, body['data']);
    }
  });
}



function get_orders_side(coin, exchange, side, cb){
  var req_url = base_url + "/market/get-open-orders/" + exchange.toUpperCase() + "_" + coin.toUpperCase() +"/" + side.toUpperCase() + "/10";
  console.log("sending request to - " + req_url)
  request({uri: req_url, json:true}, function (error, response, body){
    if(error)
      return cb(error, null);
    else if(body.error !== true){
      var orders = [];
      if(body['data'].Orders.length > 0){
        for( var i = 0; i < body['data'].Orders.length; i++) {
          var order = {
            MarketType:   body['data'].Orders[i].MarketType,
            CurrencyType: body['data'].Orders[i].CurrencyType,
            Type: body['data'].Type,
            Pair: body['data'].Pair,
            Rate: body['data'].Orders[i].Rate,
            Volume: body['data'].Orders[i].Volume,
            Total: body['data'].Orders[i].Rate * body['data'].Orders[i].Volume
          }
          orders.push(order);
        }
        return cb(null,orders);
      }
    }
  });
}

//Get Orders
function get_orders(coin, exchange, cb) {

  var buyorders = get_orders_side(coin, exchange, "buy", function(err, buys){
    var sellorders = get_orders_side(coin, exchange, "sell", function(err, sells){
      return cb(null, buys, sells);
    })
  })
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
          //Note that chartdata is available for an API, but I can't get it to return anything
          //return cb(error, {buys: buys, sells: sells, chartdata: [], trades: trades, stats: stats});
          return cb(error, {buys: buys, sells: sells, chartdata: [], trades: trades, stats: stats});
        });
      });
    });
  }
};
