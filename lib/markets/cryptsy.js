var request = require('request');

var base_url = 'https://api.cryptsy.com/api/v2/markets';
function get_summary(coin, exchange, Crymktid, cb) {
      var summary = [];
var req_url1 = base_url + '/' + Crymktid + '/ticker';
  request({uri: req_url1, json: true}, function (error, response, body) {
    if (error) {
      return cb(error, null);
    } else {
      if (body.message) {
        return cb(body.message, null)
      } else {
      }};
summary = body;
summary.data['Bid'] = body.data['bid'].toFixed(8);
summary.data['Ask'] = body.data['ask'].toFixed(8);
var req_url = base_url + '/' + Crymktid;
  request({uri: req_url, json: true}, function (error, response, body) {
    if (error) {
      return cb(error, null);
    } else {
      if (body.message) {
        return cb(body.message, null)
      } else {
        summary.data['volume'] = body.data['24hr']['volume'];
        summary.data['price_high'] = body.data['24hr']['price_high'].toFixed(8);
        summary.data['price_low'] = body.data['24hr']['price_low'];
        summary.data['Last'] = body.data['last_trade']['price'];
        summary.data['last'] = body.data['last_trade']['price'];
        summary.data['lastprice'] = body.data['last_trade']['price'];
      }};
        return cb (null, summary.data);
            }
        );
}
  );
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
      for (var i = 0; i < orders['buyorders'].length; i++){
        var order = {
          amount: parseFloat(orders.buyorders[i].quantity),
          price: parseFloat(orders.buyorders[i].price).toFixed(8),
          total: parseFloat(orders.buyorders[i].total).toFixed(8)
          // total: (parseFloat(orders.buyorders[i].quantity) * parseFloat(orders.buyorders[i].price)).toFixed(8)
        }
        buys.push(order);
        if ( i == orders['buyorders'].length - 1) {
          for (var x = 0; x < orders['sellorders'].length; x++) {
            var order = {
              amount: parseFloat(orders.sellorders[x].quantity),
              price: parseFloat(orders.sellorders[x].price).toFixed(8),
              total: parseFloat(orders.sellorders[x].total).toFixed(8)
	      // total: (parseFloat(orders.sellorders[x].quantity) * parseFloat(orders.sellorders[x].price)).toFixed(8)
            }
            sells.push(order);
            if ( x == orders['sellorders'].length - 1) {  
              return cb(null, buys,sells);
            }
          } 
        }
      }
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
