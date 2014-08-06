/**
* The Locale Module reads the locale settings and provides
* this information to the other modules
*/

var fs = require("fs");
var jsonminify = require("jsonminify");
var settings = require("./settings");

exports.menu_explorer = "Explorer",
exports.menu_api = "API",
exports.menu_markets = "Markets",

exports.ex_title = "Block Explorer",
exports.ex_search_title = "Search",
exports.ex_search_button = "Search",
exports.ex_search_message = "You may enter a block height, block hash or transaction hash.",
exports.ex_error = "Error!"
exports.ex_search_error = "Search found no results.",
exports.ex_latest_transactions = "Latest Transactions",

exports.tx_title = "Transaction Details",
exports.tx_block_hash = "Block Hash",
exports.tx_recipients = "Recipients",

exports.block_title = "Block Details",
exports.block_previous = "Previous",
exports.block_next = "Next",

exports.difficulty = "Difficulty",
exports.network = "Network",
exports.height = "Height",
exports.timestamp = "Timestamp",
exports.size = "Size",
exports.transactions = "Transactions",
exports.total_sent = "Total Sent",
exports.confirmations = "Confirmations",
exports.total = "Total",
exports.bits = "Bits",
exports.nonce = "Nonce",

exports.api_title = "API Documentation",
exports.api_message = "The block explorer provides an API allowing users and/or applications to retrieve information from the network without the need for a local wallet.",
exports.api_calls = "API Calls",
exports.api_getnetworkhashps = "Returns the current network hashrate. (hash/s)",
exports.api_getdifficulty = "Returns the current difficulty.",
exports.api_getconnectioncount = "Returns the number of connections the block explorer has to other nodes.",
exports.api_getblockcount = "Returns the number of blocks currently in the block chain.",
exports.api_getblockhash = "Returns the hash of the block at ; index 0 is the genesis block.",
exports.api_getblock = "Returns information about the block with the given hash.",
exports.api_getrawtransaction = "Returns raw transaction representation for given transaction id. decrypt can be set to 0(false) or 1(true).",


exports.reloadLocale = function reloadLocale(locale) {
  // Discover where the locale file lives
  var localeFilename = locale;
  console.log(localeFilename);
  localeFilename = "./" + localeFilename;
  console.log(localeFilename);
  var localeStr;
  try{
    //read the settings sync
    localeStr = fs.readFileSync(localeFilename).toString();
  } catch(e){
    console.warn('Locale file not found. Continuing using defaults!');
  }

  // try to parse the settings
  var lsettings;
  try {
    if(localeStr) {
      localeStr = jsonminify(localeStr).replace(",]","]").replace(",}","}");
      lsettings = JSON.parse(localeStr);
    }
  }catch(e){
    console.error('There was an error processing your locale file: '+e.message);
    process.exit(1);
  }

  //loop trough the settings
  for(var i in lsettings)
  {
    //test if the setting start with a low character
    if(i.charAt(0).search("[a-z]") !== 0)
    {
      console.warn("Settings should start with a low character: '" + i + "'");
    }

    //we know this setting, so we overwrite it
    if(exports[i] !== undefined)
    {
      exports[i] = lsettings[i];
    }
    //this setting is unkown, output a warning and throw it away
    else
    {
      console.warn("Unknown Setting: '" + i + "'. This setting doesn't exist or it was removed");
    }
  }

};

// initially load settings
exports.reloadLocale(settings.locale);