var express = require('express')
  , path = require('path')
  , bitcoinapi = require('bitcoin-node-api')
  , favicon = require('serve-favicon')
  , logger = require('morgan')
  , cookieParser = require('cookie-parser')
  , bodyParser = require('body-parser')
  , settings = require('./lib/settings')
  , routes = require('./routes/index')
  , lib = require('./lib/explorer')
  , db = require('./lib/database')
  , locale = require('./lib/locale')
  , request = require('request')
  , fs = require('fs');

var app = express();

// bitcoinapi
bitcoinapi.setWalletDetails(settings.wallet);
var commands = [];
    for(i=0; i < settings.commands_needed.length; i++){
      var cmds = JSON.parse(fs.readFileSync("coin_commands/"+settings.commands_needed[i]));
      var cmd = (settings.heavy ? cmds.heavy : cmds.default);
      for(k=0; k < cmd.length; k++){
        commands.push(cmd[k]);
      }
    }
  bitcoinapi.setAccess('only', commands);
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(favicon(path.join(__dirname, settings.favicon)));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// routes
app.use('/api', bitcoinapi.app);
app.use('/', routes);
app.use('/ext/getmoneysupply', function(req,res){
  lib.get_supply(function(supply){
    res.send(' '+supply);
  });
});

app.use('/ext/getaddress/:hash', function(req,res){
  db.get_address(req.params.hash, function(address){
    if (address) {
      var a_ext = {
        address: address.a_id,
        sent: (address.sent / 100000000),
        received: (address.received / 100000000),
        balance: (address.balance / 100000000).toString().replace(/(^-+)/mg, ''),
        last_txs: address.txs,
      };
      res.send(a_ext);
    } else {
      res.send({ error: 'address not found.', hash: req.params.hash})
    }
  });
});

app.use('/ext/getbalance/:hash', function(req,res){
  db.get_address(req.params.hash, function(address){
    if (address) {
      res.send((address.balance / 100000000).toString().replace(/(^-+)/mg, ''));
    } else {
      res.send({ error: 'address not found.', hash: req.params.hash})
    }
  });
});

app.use('/ext/getdistribution', function(req,res){
  db.get_richlist(settings.coin, function(richlist){
    db.get_stats(settings.coin, function(stats){
      db.get_distribution(richlist, stats, function(dist){
        res.send(dist);
      });
    });
  });
});

app.use('/ext/getlasttxsajax', function(req,res){
  db.get_last_txs_ajax(req.query.start, req.query.length,function(txs, count){
    var data = [];
    for(i=0; i<txs.length; i++){
      var row = [];
      row.push(txs[i].blockindex);
      row.push(txs[i].txid);
      row.push(txs[i].vout.length);
      row.push((txs[i].total / 100000000).toFixed(settings.decimal_places));
      row.push(new Date((txs[i].timestamp) * 1000).toUTCString());
      data.push(row);
    }
    res.json({"data":data, "draw": req.query.draw, "recordsTotal": count, "recordsFiltered": count});
  });
});

app.use('/ext/getaddresstransactions/:hash', function(req,res){
  db.get_address_ajax(req.params.hash,req.query.start, req.query.length,function(txs){
    var data = [];
    var length = (parseInt(req.query.length) + parseInt(req.query.start)); //facepalm
    //facepalm for days. I'm sure there's a saying out there that just because you can, doesn't mean you should.
    //works though.
    var ntx = txs.txes.reverse();
    for(i=req.query.start; i<length; i++){
      var row = [];
      var mtx = ntx[i];
      row.push(lib.format_unixtime(mtx.timestamp));
      row.push(mtx.txid);
      var done = false;
      var out = 0;
      var vin = 0;
      for(r = 0; r < mtx.vout.length; r++){
        if(mtx.vout[r].addresses == req.params.hash)
          out = mtx.vout[r].amount;
      }
      for(s = 0; s < mtx.vin.length; s++){
        if(mtx.vin[s].addresses == req.params.hash)
          out = mtx.vin[s].amount;
      }
      if (out > 0 && vin > 0){
        var amount = (out - vin) / 100000000
        if (amount < 0){
          amount = amount * -1
          console.log('here');
          row.push("- "+amount.toFixed(settings.decimal_places));
        }else if(amount > 0){
          row.push( "+ "+ amount.toFixed(settings.decimal_places));
        }else{
          row.push(amount.toFixed(settings.decimal_places))
        }
      }else if(out > 0){
        var amount = out / 100000000
        row.push("+ " + amount.toFixed(settings.decimal_places))
      }else{
        var amount = vin / 100000000
        row.push("- " +amount.toFixed(settings.decimal_places))
      }
      data.push(row);
    }
    res.json({"data":data, "draw": req.query.draw, "recordsTotal": txs.totalTxes, "recordsFiltered": txs.totalTxes});
  });
});

app.use('/ext/getlasttxs/:min', function(req,res){
  db.get_last_txs(settings.index.last_txs, (req.params.min * 100000000), function(txs){
    res.send({data: txs});
  });
});

app.use('/ext/connections', function(req,res){
  db.get_peers(function(peers){
    res.send({data: peers});
  });
});

// locals
app.set('title', settings.title);
app.set('symbol', settings.symbol);
app.set('coin', settings.coin);
app.set('locale', locale);
app.set('display', settings.display);
app.set('markets', settings.markets);
app.set('genesis_block', settings.genesis_block);
app.set('index', settings.index);
app.set('heavy', settings.heavy);
app.set('txcount', settings.txcount);
app.set('nethash', settings.nethash);
app.set('nethash_units', settings.nethash_units);
app.set('show_sent_received', settings.show_sent_received);
app.set('logo', settings.logo);
app.set('theme', settings.theme);
app.set('labels', settings.labels);
app.set('decimal_places', settings.decimal_places);
/*for(i=0;i<Object.keys(settings.social).length; i++)
{
  app.set(Object.keys(settings.social)[i], Object.values(settings.social)[i]);
}*/
/*
Object.keys(settings.social).forEach(function(key) {
  app.set(key, settings.social[key]);
});*/
app.set("social", settings.social);

app.use('/ext/testsocial', function(req,res){
  Object.keys(settings.social).forEach(function(key) {
    var val = settings.social[key];
    res.json(key);
  });
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

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
