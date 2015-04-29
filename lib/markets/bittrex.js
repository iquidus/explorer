var request = require('request');

var base_url = 'https://bittrex.com/api/v1.1/public';

function get_summary(coin, exchange, cb) {
  var req_url = base_url + '/getmarketsummary?market=' + exchange + '-' + coin;
  request({uri: req_url, json: true}, function (error, response, body) {
    if (error) {
      console.log(error);
      return cb(error, null);
    } else {
      if (body.message) {
        console.log(body.message);
        return cb(body.message, null)
      } else {
        body.result[0]['last'] = body.result[0]['Last'];
        return cb (null, body.result[0]);
      }
    }
  });
}

function get_trades(coin, exchange, cb) {
  var req_url = base_url + '/getmarkethistory?market=' + exchange + '-' + coin + '&count=50';
  request({uri: req_url, json: true}, function (error, response, body) {
    if (error) {
      console.log(error);
      return cb(error, null);
    } else {
      if (body.message) {
        console.log(body.message);
        return cb(body.message, null)
      } else {
        return cb (null, body.result);
      }
    }
  });
}

function get_orders(coin, exchange, cb) {
  var req_url = base_url + '/getorderbook?market='  + exchange + '-' + coin + '&type=both' + '&depth=50';
  request({uri: req_url, json: true}, function (error, response, body) {
    if (error) {
      console.log(error);
      return cb(error, null);
    } else {
      var orders = body.result;
      var buys = [];
      var sells = [];
      for (var i = 0; i < orders['buy'].length; i++){
        var order = {
          amount: parseFloat(orders.buy[i].Quantity),
          price: parseFloat(orders.buy[i].Rate),
          total: (parseFloat(orders.buy[i].Quantity) * parseFloat(orders.buy[i].Rate)).toFixed(8)
        }
        buys.push(order);
        if ( i == orders['buy'].length - 1) {
          for (var x = 0; x < orders['sell'].length; x++) {
            var order = {
              amount: parseFloat(orders.sell[x].Quantity),
              price: parseFloat(orders.sell[x].Rate),
              total: (parseFloat(orders.sell[x].Quantity) * parseFloat(orders.sell[x].Rate)).toFixed(8)
            }
            sells.push(order);
            if ( x == orders['sell'].length - 1) {  
              return cb(buys,sells);
            }
          } 
        }
      }
    }
  });
}

module.exports = {
  get_data: function(coin, exchange, cb) {
    get_orders(coin, exchange, function(buys, sells) {
      get_trades(coin, exchange, function(err, trades) {
        get_summary(coin, exchange, function(err, stats) {
          return cb({buys: buys, sells: sells, chartdata: [], trades: trades, stats: stats});
        });
      });
    });
  }
};