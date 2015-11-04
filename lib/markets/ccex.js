var request = require('request');
var base_url = 'https://c-cex.com/t/';
var d1 = new Date();
var d2 = new Date();
d1.setDate(d1.getDate() - 2); 

function pad(x) {
    if (x < 10) return "0" + x;
    return x;
}

function toTimestamp(strDate) {
    var datum = Date.parse(strDate);
    return datum / 1000;
}

function formatdate(date1) {
    var formatted = (date1.getUTCFullYear()) + '-' + pad((date1.getUTCMonth() + 1)) + '-' + pad(date1.getUTCDate());
    return formatted;
}

function sleep9s() {
    var start = new Date().getTime();
    for (var i = 0; i < 1e9; i++) {
        if ((new Date().getTime() - start) > 59000) {
            break;
        }
    }
}

function get_summary(coin, exchange, cb) {
    var summary = {};
    sleep9s;
    request({ uri: base_url + 's.html?a=volume&h=24&pair=' + coin + '-' + exchange, json: true }, function (error, response, body) {
        if (error) {
            return cb(error, null);
        } else if (body.return != undefined) {
            var i = body.return.length - 1
            summary['volume'] = body.return[i]['volume_' + coin].toFixed(8);
            summary['volume_btc'] = body.return[i]['volume_' + exchange].toFixed(8);
            sleep9s;
            request({ uri: base_url + '/' + coin + '-' + exchange + '.json', json: true }, function (error, response, body) {
                if (error) {
                    return cb(error, null);
                } else if (body != undefined) {
                    summary['bid'] = body.ticker['buy'].toFixed(8);
                    summary['ask'] = body.ticker['sell'].toFixed(8);
                    summary['high'] = body.ticker['high'].toFixed(8);
                    summary['low'] = body.ticker['low'].toFixed(8);
                    summary['last'] = body.ticker['lastprice'].toFixed(8);
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
    var req_url = base_url + 's.html?a=tradehistory&d1=' + formatdate(d1) + '&d2=' + formatdate(d2) + '&pair=' + coin + '-' + exchange;
    sleep9s;
    request({ uri: req_url, json: true }, function (error, response, body) {
        if (body.return != undefined) {
            var tTrades = body.return;
            var trades = [];
            if (tTrades == "No trade history for this period") {
                return cb(tTrades, null);

            } else {
                for (var i = 0; i < tTrades.length; i++) {
                    var Trade = {
                        ordertype: tTrades[i].type,
                        amount: parseFloat(tTrades[i].amount).toFixed(8),
                        price: parseFloat(tTrades[i].rate).toFixed(8),
                        total: (parseFloat(tTrades[i].amount).toFixed(8) * parseFloat(tTrades[i].rate)).toFixed(8),
                        datetime: tTrades[i].datetime,
                        timestamp: toTimestamp(tTrades[i].datetime + 'Z'),
                        backrate: tTrades[i].backrate
                    }
                    trades.push(Trade);
                }
            }
            return cb(null, trades);
        } else {
            return cb(body.message, null);
        }
    });
}

function get_orders(coin, exchange, ccex_key, cb) {
    var req_url = base_url + 'r.html?key=' + ccex_key + '&a=orderlist&self=0&pair=' + coin + '-' + exchange;
    sleep9s;
    request({ uri: req_url, json: true }, function (error, response, body) {
        if (body != undefined) {
            var orders = body;
            orders.Data = body['return'];
            var buys = [];
            var sells = [];
            for (Data in orders.Data) {
                var order = {
                    otype: orders.Data[Data].type,
                    amount: parseFloat(orders.Data[Data].amount.toFixed(8)),
                    price: parseFloat(orders.Data[Data].price).toFixed(8),
                    total: (parseFloat(orders.Data[Data].amount) * parseFloat(orders.Data[Data].price)).toFixed(8)
                }
                if (order.otype == 'buy') {
                    buys.push(order);
                } else {
                    sells.push(order);
                }
            }
            return cb(null, buys, sells);
        } else {
            return cb(body.message, [], [])
        }
    });
}

module.exports = {
    get_data: function (coin, exchange, ccex_key, cb) {
        var error = null;
        get_orders(coin, exchange, ccex_key, function (err, buys, sells) {
            if (err) { error = err; }
            get_trades(coin, exchange, function (err, trades) {
                if (err) { error = err; }
                get_summary(coin, exchange, function (err, stats) {
                    if (err) { error = err; }
                    return cb(error, { buys: buys, sells: sells, chartdata: [], trades: trades, stats: stats });
                });
            });
        });
    }
};

