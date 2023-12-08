const request = require('request')
const base_url = 'https://api.xeggex.com/api/v2/';

const d1 = new Date();
const d2 = new Date();
d1.setDate(d1.getDate() - 2);

function pad(x) {
  if (x < 10) return "0" + x;
  return x;
}

function toTimestamp(strDate) {
  const datum = Date.parse(strDate);
  return datum / 1000;
}

function formatdate(date1) {
  const formatted = (date1.getUTCFullYear()) + '-' + pad((date1.getUTCMonth() + 1)) + '-' + pad(date1.getUTCDate());
  return formatted;
}

function sleep9s() {
  const start = new Date().getTime();
  for (let i = 0; i < 1e9; i++) {
    if ((new Date().getTime() - start) > 59000) {
      break;
    }
  }
}


//Todo: refactor this function get_summary to make more sense
function get_summary(coin, exchange, cb) {
  let summary = {}
  request({
    uri: base_url + 'market/getbysymbol/' + coin + '_' + exchange,
    json: true
  }, function (error, response, body) {
    if (error) {
      return cb(body["error"].message, null)
    } else {
      //Get the most recent market details
      summary['volume'] = body["volumeNumber"].toFixed(8)
      summary['volume_usdt'] = body["volumeUsdNumber"].toFixed(8)

      //get the market statistics for the last 24hrs
      request({uri: base_url + 'ticker/' + coin + '_' + exchange, json: true}, function (error, response, body) {
        if (error) {
          return cb(body["error"].message, null)
        } else {
          summary['bid'] = parseFloat(body["bid"]).toFixed(8)
          summary['ask'] = parseFloat(body["ask"]).toFixed(8)
          summary['high'] = parseFloat(body["high"]).toFixed(8)
          summary['low'] = parseFloat(body["low"]).toFixed(8)
          summary['last'] = parseFloat(body["last_price"]).toFixed(8)
          summary['prevday'] = parseFloat(body["yesterdayPriceNumber"]).toFixed(8)
          return cb(null, summary);
        }
      })
    }
  })
}


/*
function get_summary(coin, exchange, cb) {
  const req_url = base_url + 'market/getbysymbol/' + coin + '_' + exchange
  request({uri: req_url, json: true}, function (error, response, body) {
    if (error) {
      return cb(body["error"].message, null)
    } else {
      return cb(null, body)
    }
  })
}
*/


function get_trades(coin, exchange, cb) {
  let req_url = base_url + 'historical_trades?ticker_id=' + coin + '_' + exchange + '&limit=50'
  request({uri: req_url, json: true}, function (error, response, body) {
    if (error) {
      return cb(body["error"].message, null)
    } else {
      return cb(null, body)
    }
  })
}

function get_orders(coin, exchange, cb) {
  let req_url = base_url + 'orderbook?ticker_id=' + coin + '_' + exchange + '&depth=100'
  request({uri: req_url, json: true}, function (error, response, body) {
    if (error) {
      return cb(body["error"].message, null)
    } else if (body) {
      let orders = body
      let buys = []
      let sells = []
      if (orders['bids'].length > 0) {
        for (let i = 0; i < orders['bids'].length; i++) {
          let quantity = parseFloat(orders["bids"][i][1]).toFixed(8)
          let quantityPrice = parseFloat(orders["bids"][i][0]).toFixed(8)
          let order = {
            amount: quantity,
            price: quantityPrice,
            total: quantity * quantityPrice
          }
          buys.push(order)
        }
      }

      if (orders['asks'].length > 0) {
        for (let i = 0; i < orders['asks'].length; i++) {
          let quantity = parseFloat(orders["asks"][i][1]).toFixed(8)
          let quantityPrice = parseFloat(orders["asks"][i][0]).toFixed(8)
          let order = {
            amount: quantity,
            price: quantityPrice,
            total: quantity * quantityPrice
          }
          sells.push(order)
        }
      }
      return cb(null, buys, sells)
    } else {
      return cb(body["error"].message, [], [])
    }

  })
}


function get_chartdata(coin, exchange, cb) {

}

module.exports = {
  get_data: function (settings, cb) {
    let error = null;
    /*get_chartdata(settings.coin, settings.exchange, function (err, chartdata) {
      if (err) {
        chartdata = [];
        error = err;
      }*/
    get_orders(settings.coin, settings.exchange, function (err, buys, sells) {
      if (err) {
        error = err
      }
      get_trades(settings.coin, settings.exchange, function (err, trades) {
        if (err) {
          error = err
        }
        get_summary(settings.coin, settings.exchange, function (err, stats) {
          if (err) {
            error = err
          }
          return cb(error, {buys: buys, sells: sells, chartdata: [], trades: trades, stats: stats})
        })
      })
    })
    //})
  }
}