var request = require('request');

var base_url = 'https://c-patex.com/api/v2/';

function get_summary(coin, exchange, cb) {
    var req_url = base_url + 'tickers/' + coin.toLowerCase() + exchange.toLowerCase() + '.json';
    var summary = {};
    request({uri: req_url, json: true}, function (error, response, body) {
        if (error) {
            return cb(error, null);
        } else if (body.error) {
            return cb(body.error, null);
        } else {
            summary['high'] = parseFloat(body['ticker']['high']).toFixed(8);
            summary['low'] = parseFloat(body['ticker']['low']).toFixed(8);
            summary['bid'] = parseFloat(body['ticker']['buy']).toFixed(8);
            summary['ask'] = parseFloat(body['ticker']['sell']).toFixed(8);
            summary['volume'] = parseFloat(body['ticker']['vol']).toFixed(8);
            summary['volume_btc'] = parseFloat(body['ticker']['vol']).toFixed(8) * parseFloat(body['ticker']['last']).toFixed(8);
            summary['last'] = parseFloat(body['ticker']['last']).toFixed(8);
            return cb(null, summary);
        }

    });

}

function get_trades(coin, exchange, cb) {
    var req_url = base_url + 'trades.json?market=' + coin.toLowerCase() + exchange.toLowerCase();
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
                    amount: parseFloat(body[i]["volume"]).toFixed(8),
                    price: parseFloat(body[i]["price"]).toFixed(8),
                    timestamp: formatTime(body[i]["created_at"]),
                    total: parseFloat(body[i]["volume"] + body[i]["price"]).toFixed(8),
                }
                trades.push(trade);
            }
            console.log(trades);
            return cb (null, trades);
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
    var req_url = base_url + 'order_book?market=' + coin.toLowerCase() + exchange.toLowerCase();
    request({uri: req_url, json: true}, function (error, response, body) {
        if (!error) {
            var orders = body;
            var buys = [];
            var sells = [];
            if (orders['bids'].length > 0){
                for (var i = 0; i < orders['bids'].length; i++) {
                    var order = {

                        amount: parseFloat(orders['bids'][i].remaining_volume).toFixed(8),
                        price: parseFloat(orders['bids'][i].price).toFixed(8),
                        total: (parseFloat(orders['bids'][i].remaining_volume).toFixed(8) * parseFloat(orders['bids'][i].price)).toFixed(8)
                    }
                    buys.push(order);
                }
            }
            if (orders['asks'].length > 0) {
                for (var x = 0; x < orders['asks'].length; x++) {
                    var order = {
                        amount: parseFloat(orders['asks'][x].remaining_volume).toFixed(8),
                        price: parseFloat(orders['asks'][x].price).toFixed(8),
                        total: (parseFloat(orders['asks'][x].remaining_volume).toFixed(8) * parseFloat(orders['asks'][x].price)).toFixed(8)
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