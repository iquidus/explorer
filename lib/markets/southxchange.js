var request = require('request');

var base_url = 'https://www.southxchange.com/api/';

function get_summary(coin, exchange, cb) {
    var req_url = base_url + 'price/' + coin.toLowerCase() + '/' + exchange.toLowerCase();
    var summary = {};
        request({uri: req_url, json: true}, function (error, response, body) {
            if (error) {
                return cb(error, null);
            } else if (body.error) {
                return cb(body.error, null);
            } else {
                summary['bid'] = parseFloat(body['Bid']).toFixed(8);
                summary['ask'] = parseFloat(body['Ask']).toFixed(8);
                summary['volume'] = parseFloat(body['Volume24Hr']).toFixed(8);
                summary['volume_btc'] = parseFloat(body['Volume24Hr']).toFixed(8) * parseFloat(body['Last']).toFixed(8);
                summary['last'] = parseFloat(body['Last']).toFixed(8);
                summary['change'] = parseFloat(body['Variation24Hr']).toFixed(8);
                return cb(null, summary);
            }

        });

}

    function get_trades(coin, exchange, cb) {
        var req_url = base_url + 'trades/' + coin.toLowerCase() + '/' + exchange.toLowerCase();
        console.log(req_url);
        request({uri: req_url, json: true}, function (error, response, body) {
            if (error) {
                return cb(error, null);
            } else if (body.error == true){
                return cb(error, null);
            } else {
                var trades = [];
                console.log(body.length);
                for (var i = 0; i < body.length; i++) {
                    var trade = {
                        type: body[i]["Type"],
                        amount: parseFloat(body[i]["Amount"]).toFixed(8),
                        price: parseFloat(body[i]["Price"]).toFixed(8),
                        timestamp: body[i]["At"],
                        total: parseFloat(body[i]["Amount"]).toFixed(8) * parseFloat(body[i]["Price"]).toFixed(8),
                    }
                    trades.push(trade);
                }
                return cb (null, trades);
            }


        });
    }

    function get_orders(coin, exchange, cb) {
        var req_url = base_url + 'book/' + coin.toLowerCase() + '/' + exchange.toLowerCase();
        request({uri: req_url, json: true}, function (error, response, body) {
            if (!error) {
                var orders = body;
                var buys = [];
                var sells = [];
                if (orders['BuyOrders'].length > 0){
                    for (var i = 0; i < orders['BuyOrders'].length; i++) {
                        var order = {
                            amount: parseFloat(orders['BuyOrders'][i].Amount).toFixed(8),
                            price: parseFloat(orders['BuyOrders'][i].Price).toFixed(8),
                            //  total: parseFloat(orders.buy[i].Total).toFixed(8)
                            // Necessary because API will return 0.00 for small volume transactions
                            total: (parseFloat(orders['BuyOrders'][i].Amount).toFixed(8) * parseFloat(orders['BuyOrders'][i].Price)).toFixed(8)
                        }
                        buys.push(order);
                    }
                }
                if (orders['SellOrders'].length > 0) {
                    for (var x = 0; x < orders['SellOrders'].length; x++) {
                        var order = {
                            amount: parseFloat(orders['SellOrders'][x].Amount).toFixed(8),
                            price: parseFloat(orders['SellOrders'][x].Price).toFixed(8),
                            //    total: parseFloat(orders.sell[x].Total).toFixed(8)
                            // Necessary because API will return 0.00 for small volume transactions
                            total: (parseFloat(orders['SellOrders'][i].Amount).toFixed(8) * parseFloat(orders['SellOrders'][i].Price)).toFixed(8)
                        }
                        sells.push(order);
                    }
                }
                return cb(null, buys, sells);
            } else {
                return cb(null, [], []);
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
                    get_summary(settings.coin, settings.exchange, function(err, stats) {
                        if (err) { error = err; }
                        return cb(error, {buys: buys, sells: sells, chartdata: [], trades: trades, stats: stats});
                    });
                });
            });
        }
    };