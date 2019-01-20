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
  , i18next = require('i18next')
  , i18nextMiddleware = require('i18next-express-middleware')
  , i18Backend = require('i18next-node-fs-backend')
  , request = require('request')
  , fs = require('fs');

var app = express();

// bitcoinapi
bitcoinapi.setWalletDetails(settings.wallet);
var commands = [];
    for(i=0; i < settings.commands_needed.length; i++){
      var cmds = JSON.parse(fs.readFileSync("coin_commands/"+settings.commands_needed[i]));
      if(settings.heavy){
        for(k=0; k < cmds.heavy.length; k++){
          commands.push(cmds.heavy[k]);
        }
      }
      for(k=0; k < cmds.default.length; k++){
        commands.push(cmds.default[k]);
      }

    }
  bitcoinapi.setAccess('only', commands);

// Language setup
i18next
  .use(i18Backend)
  .use(i18nextMiddleware.LanguageDetector)
  .init({
    interpolation: {
      format: function(value, format, lng) {
          if (format === 'uppercase') return value.toUpperCase();
          if(value instanceof Date) return moment(value).format(format);
          return value;
        }
    },
    backend: {
      loadPath: __dirname + '/locale/{{lng}}/{{ns}}.json',
      addPath: __dirname + '/locale/{{lng}}/{{ns}}.missing.json'
    },
    detection: {
      order: ['querystring', 'cookie'],
      caches: ['cookie']
    },
   
    fallbackLng: settings.language_fallback,
    preload: settings.language,
    saveMissing: true,
    debug: false
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(i18nextMiddleware.handle(i18next));

app.use(favicon(path.join(__dirname, settings.favicon)));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Add Languages to Local Variabels
app.use(function (req, res, next) {
  res.locals.currentlang = req.language;

  next();
})

// Language Files for Datatable
app.use('/datatable/lang', function(req,res){
    i18next.changeLanguage(req.language, (err, t) => {
      if (err) return console.log('something went wrong loading', err);
      res.send(i18next.t("datatable", { returnObjects: true }));
    });   
});

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

app.use('/ext/get_masternode_rewards/:hash/:since', function(req, res){
  db.get_masternode_rewards(req.params.since, req.params.hash,function(rewards){
    if(rewards){
      res.json(rewards);
    } else {
      res.send({error: "something wrong", hash: req.params.hash, since: req.params.since});
    }
  })
})

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
  if(req.query.length > settings.index.last_txs){
    req.query.length = settings.index.last_txs;
  }
  db.get_last_txs_ajax(req.query.start, req.query.length,function(txs, count){
    var data = [];
    for(i=0; i<txs.length; i++){
      var row = [];
      row.push(txs[i].blockindex);
      row.push(txs[i].blockhash);
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

app.post('/address/:hash/claim', function(req, res){
  var address = req.body.address;
  var signature = req.body.signature;
  var message = req.body.message;
  request({
      url: 'http://127.0.0.1:' + settings.port + '/api/verifymessage?address='+address+ '&signature='+ signature + '&message=' + message,
    method: 'GET',
  }, function(error, response, body){
    //console.log('error', error);
    //console.log('response', response);
    if(body == "false"){
      console.log('failed');
      res.json({"status": "failed", "error":true, "message": error});
    }else if(body == "true"){
      db.update_label(address, message, function(){
        res.json({"status": "success"});
      })
    }
  });
})

app.use('/ext/connections', function(req,res){
  db.get_peers(function(peers){
    res.send({data: peers});
  });
});

//Masternodes 
app.use('/ext/getmasternodes', function(req, res) {
   db.get_masternodes(function(masternode){
    res.send({data: masternode});
   });
});

// locals
app.set('title', settings.title);
app.set('symbol', settings.symbol);
app.set('coin', settings.coin);
//app.set('locale', locale);
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
app.set('frontpage_layout', settings.frontpage_layout);
app.set('coininfo', settings.coininfo);
/*for(i=0;i<Object.keys(settings.social).length; i++)
{
  app.set(Object.keys(settings.social)[i], Object.values(settings.social)[i]);
}*/
/*
Object.keys(settings.social).forEach(function(key) {
  app.set(key, settings.social[key]);
});*/
app.set("social", settings.social);


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
