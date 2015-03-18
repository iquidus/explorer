/**
* The Settings Module reads the settings out of settings.json and provides
* this information to the other modules
*/

var fs = require("fs");
var jsonminify = require("jsonminify");


//The app title, visible e.g. in the browser window
exports.title = "blockchain";

//The url it will be accessed from
exports.address = "explorer.example.com";

// logo
exports.logo = "/images/logo.png";


//The app favicon fully specified url, visible e.g. in the browser window
exports.favicon = "favicon.ico";

//Theme
exports.theme = "Cyborg";

//The Port ep-lite should listen to
exports.port = process.env.PORT || 3001;


//coin symbol, visible e.g. MAX, LTC, HVC
exports.symbol = "BTC";


//coin name, visible e.g. in the browser window
exports.coin = "Bitcoin";


//This setting is passed to MongoDB to set up the database
exports.dbsettings = { 
  "user": "iquidus",
  "password": "3xp!0reR",
  "database": "blockchaindb", 
  "address" : "localhost", 
  "port" : 27017 
};


//This setting is passed to the wallet 
exports.wallet = { "host" : "127.0.0.1", 
  "port" : 8669, 
  "user" : "bitcoinrpc", 
  "pass" : "password"
};


//Locale file
exports.locale = "locale/en.json",


//Menu items to display
exports.display = { 
  "api": true, 
  "market": true, 
  "twitter": true, 
  "search": true,  
  "richlist": true
};


//API view
exports.api = {
  "blockindex": 1337,
  "blockhash": "00000000002db22bd47bd7440fcad99b4af5f3261b7e6bd23b7be911e98724f7",
  "txhash": "c251b0f894193dd55664037cbf4a11fcd018ae3796697b79f5097570d7de95ae",
  "address": "RBiXWscC63Jdn1GfDtRj8hgv4Q6Zppvpwb",
};
  
// markets
exports.markets = {
  "coin": "HVC",
  "exchange": "BTC",
  "poloniex": true,
  "bittrex": true
};

// richlist/top100 settings
exports.richlist = {
  "distribution": true,
  "received": true,
  "balance": true
};

//index
exports.index = {
  "show_hashrate": false,
  "difficulty": "POW",
  "last_txs": 100
};

// twitter
exports.twitter = "iquidus";
exports.confirmations = 6;

//timeouts
exports.update_timeout = 125;
exports.check_timeout = 250;


//genesis
exports.genesis_tx = "65f705d2f385dc85763a317b3ec000063003d6b039546af5d8195a5ec27ae410";
exports.genesis_block = "b2926a56ca64e0cd2430347e383f63ad7092f406088b9b86d6d68c2a34baef51";

exports.heavy = false;
exports.txcount = 100;
exports.show_sent_received = true;
exports.supply = "COINBASE";
exports.nethash = "getnetworkhashps";

exports.labels = {};

exports.reloadSettings = function reloadSettings() {
  // Discover where the settings file lives
  var settingsFilename = "settings.json";
  settingsFilename = "./" + settingsFilename;

  var settingsStr;
  try{
    //read the settings sync
    settingsStr = fs.readFileSync(settingsFilename).toString();
  } catch(e){
    console.warn('No settings file found. Continuing using defaults!');
  }

  // try to parse the settings
  var settings;
  try {
    if(settingsStr) {
      settingsStr = jsonminify(settingsStr).replace(",]","]").replace(",}","}");
      settings = JSON.parse(settingsStr);
    }
  }catch(e){
    console.error('There was an error processing your settings.json file: '+e.message);
    process.exit(1);
  }

  //loop trough the settings
  for(var i in settings)
  {
    //test if the setting start with a low character
    if(i.charAt(0).search("[a-z]") !== 0)
    {
      console.warn("Settings should start with a low character: '" + i + "'");
    }

    //we know this setting, so we overwrite it
    if(exports[i] !== undefined)
    {
      exports[i] = settings[i];
    }
    //this setting is unkown, output a warning and throw it away
    else
    {
      console.warn("Unknown Setting: '" + i + "'. This setting doesn't exist or it was removed");
    }
  }

};

// initially load settings
exports.reloadSettings();