var request = require('request');

var base_url = 'https://bitglo.io/api/v2/tickers';
function get_summary(coin, exchange, cb) {
  var summary = {};
  var url=base_url + '/' + coin.concat(exchange).toLowerCase();
  request({"rejectUnauthorized": false, uri: url, json: true}, function (error, response, body) {
    if (error) {
      return cb(error, null);
    } else if (body.error !== true) {
      summary['ask'] = parseFloat(body['ticker']['buy']).toFixed(8);
      summary['bid'] = parseFloat(body['ticker']['sell']).toFixed(8);
      request({"rejectUnauthorized": false, uri: url , json: true}, function (error, response, body) {
        if (error) {
          return cb(error, null);
        } else if (body.error !== true) {
          summary['volume'] = parseFloat(body['ticker']['vol']).toFixed(8);
          summary['volume_btc'] = parseFloat(body['ticker']['vol_btc']).toFixed(8);
          summary['high'] = parseFloat(body['ticker']['high']).toFixed(8);
          summary['low'] = parseFloat(body['ticker']['low']).toFixed(8);
          summary['last'] = parseFloat(body['ticker']['last']).toFixed(8);
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
function get_trades(coin, exchange, cb) {
    return cb('not realized', summary);
}

function get_orders(coin, exchange, cb) {
    return cb('not realized', summary);
}

module.exports = {
  get_data: function(coin, exchange, cb) {
  var error = null;
    get_summary(coin, exchange,  function(err, stats) {
      if (err) { error = err; }
      return cb(error, {buys: [], sells: [], chartdata: [], trades: [], stats: stats});
    });
  }
};