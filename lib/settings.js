/**
* The Settings Module reads the settings out of settings.json and provides
* this information to the other modules
*/

const config = require('config');
const fs = require('fs');
const jsonminify = require('jsonminify');

// config.get() will throw an exception if a key isn't found, this covers that case
function safeGet(prop) {
  if (config.has(prop)) return config.get(prop);
  return undefined;
}

//The app title, visible e.g. in the browser window
exports.title = safeGet('title') || 'blockchain';

//The url it will be accessed from
exports.address = safeGet('address') || 'explorer.example.com';

// logo
exports.logo = safeGet('logo') || '/images/logo.png';

//The app favicon fully specified url, visible e.g. in the browser window
exports.favicon = safeGet('favicon') || 'favicon.ico';

//Theme
exports.theme = safeGet('theme') || 'Cyborg';

//The Port ep-lite should listen to
exports.port = process.env.PORT || safeGet('port') || 3001;


//coin symbol, visible e.g. MAX, LTC, HVC
exports.symbol = safeGet('symbol') || 'BTC';


//coin name, visible e.g. in the browser window
exports.coin = safeGet('coin') || 'Bitcoin';


//This setting is passed to MongoDB to set up the database
exports.dbsettings = safeGet('dbsettings') || {
  'uri': 'mongodb://iquidus:3xp!0reR@localhost:27017/blockchain-explorer',
  'options': { 'useNewUrlParser': true },
  'benchmark_uri': 'mongodb://iquidus:3xp!0reR@localhost:27017/explorer-benchmark',
  'benchmark_options': { 'useNewUrlParser': true }
};


//This setting is passed to the wallet
// must be of this format in order for bitcoin-node-api to accept it
const savedWallet = safeGet('wallet') || { url: '' };
const [match, host, port] = savedWallet.url.match(/([\d\.]*):(\d*)$/) || []
exports.wallet = {
  'host' : host || '127.0.0.1',
  'port' : port || 8669,
  'user' : savedWallet.username || 'bitcoinrpc',
  'pass' : savedWallet.password || 'password'
};


//Locale file
exports.locale = safeGet('locale') || 'locale/en.json',


//Menu items to display
exports.display = safeGet('display') || {
  'api': true,
  'market': true,
  'twitter': true,
  'facebook': false,
  'googleplus': false,
  'youtube': false,
  'search': true,
  'richlist': true,
  'movement': true,
  'network': true
};


//API view
exports.api = safeGet('api') || {
  'blockindex': 1337,
  'blockhash': '00000000002db22bd47bd7440fcad99b4af5f3261b7e6bd23b7be911e98724f7',
  'txhash': 'c251b0f894193dd55664037cbf4a11fcd018ae3796697b79f5097570d7de95ae',
  'address': 'RBiXWscC63Jdn1GfDtRj8hgv4Q6Zppvpwb',
};

// markets
exports.markets = safeGet('markets') || {
  'coin': 'JBS',
  'exchange': 'BTC',
  'enabled': ['bittrex'],
  'default': 'bittrex'
};

// richlist/top100 settings
exports.richlist = safeGet('richlist') || {
  'distribution': true,
  'received': true,
  'balance': true
};

exports.movement = safeGet('movement') || {
  'min_amount': 100,
  'low_flag': 1000,
  'high_flag': 10000
},

//index
exports.index = safeGet('index') || {
  'show_hashrate': false,
  'difficulty': 'POW',
  'last_txs': 100
};

// twitter
exports.twitter = safeGet('twitter') || 'iquidus';
exports.facebook = safeGet('facebook') || 'yourfacebookpage';
exports.googleplus = safeGet('googleplus') || 'yourgooglepluspage';
exports.youtube = safeGet('youtube') || 'youryoutubechannel';

exports.confirmations = safeGet('confirmations') || 6;

//timeouts
exports.update_timeout = safeGet('update_timeout') || 125;
exports.check_timeout = safeGet('check_timeout') || 250;


//genesis
exports.genesis_tx = safeGet('genesis_tx') || '65f705d2f385dc85763a317b3ec000063003d6b039546af5d8195a5ec27ae410';
exports.genesis_block = safeGet('genesis_block') || 'b2926a56ca64e0cd2430347e383f63ad7092f406088b9b86d6d68c2a34baef51';

exports.heavy = safeGet('heavy') || false;
exports.txcount = safeGet('txcount') || 100;
exports.show_sent_received = safeGet('show_sent_received') || true;
exports.supply = safeGet('supply') || 'COINBASE';
exports.nethash = safeGet('nethash') || 'getnetworkhashps';
exports.nethash_units = safeGet('nethash_units') || 'G';

exports.labels = safeGet('labels') || {};
