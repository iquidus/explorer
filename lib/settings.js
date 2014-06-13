/**
* The Settings Module reads the settings out of settings.json and provides
* this information to the other modules
*/

var fs = require("fs");
var jsonminify = require("jsonminify");

/**
* The app title, visible e.g. in the browser window
*/
exports.title = "blockchain";

/**
* The url it will be accessed from
*/
exports.address = "explorer.example.com";

/**
* The app favicon fully specified url, visible e.g. in the browser window
*/
exports.favicon = "favicon.ico";

/**
* The Port ep-lite should listen to
*/
exports.port = process.env.PORT || 3001;

/**
* coin symbol, visible e.g. MAX, LTC, HVC
*/
exports.symbol = "BTC";

/**
* coin name, visible e.g. in the browser window
*/
exports.coin = "Bitcoin";

/**
* This setting is passed to MongoDB to set up the database
*/
exports.dbsettings = { "database" : "blockchaindb", "address" : "localhost", "port" : 27017 };

/**
* This setting is passed to the wallet 
*/
exports.wallet = { "host" : "127.0.0.1", "port" : 8669, "user" : "bitcoinrpc", "pass" : "password"};

/**
* Locale file
*/
exports.locale = "locale/en.json",

/**
* Menu items to display
*/
exports.display = { "api": true },

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