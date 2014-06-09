var express = require('express');
var path = require('path');
var bitcoinapi = require('bitcoin-node-api');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var settings = require('./lib/settings');
var routes = require('./routes/index');


var app = express();


// bitcoinapi
bitcoinapi.setWalletDetails(settings.wallet);
bitcoinapi.setAccess('only', ['getnetworkhashps', 'getdifficulty', 'getconnectioncount', 
  'getblockcount', 'getblockhash', 'getblock', 'getrawtransaction']);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon(path.join(__dirname, settings.favicon)));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api', bitcoinapi.app);

app.use('/', routes);
//app.use('/info', routes);
//app.use('/tx/:txid', routes);



/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
