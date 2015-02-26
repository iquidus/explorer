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
exports.menu_richlist = "Rich List",
exports.menu_reward = "Reward",

exports.ex_title = "Block Explorer",
exports.ex_search_title = "Search",
exports.ex_search_button = "Search",
exports.ex_search_message = "You may enter a block height, block hash ,tx hash or address.",
exports.ex_error = "Error!",
exports.ex_warning = "Warning:",
exports.ex_search_error = "Search found no results.",
exports.ex_latest_transactions = "Latest Transactions",
exports.ex_summary = "Block Summary",
exports.ex_supply = "Coin Supply",
exports.ex_block = "Block",
exports.tx_title = "Transaction Details",
exports.tx_block_hash = "Block Hash",
exports.tx_recipients = "Recipients",
exports.tx_contributors = "Contributor(s)",
exports.tx_hash = "Hash",
exports.tx_address = "Address",
exports.tx_nonstandard = "NONSTANDARD TX",

exports.block_title = "Block Details",
exports.block_previous = "Previous",
exports.block_next = "Next",
exports.block_genesis = "GENESIS",

exports.difficulty = "Difficulty",
exports.network = "Network",
exports.height = "Height",
exports.timestamp = "Timestamp",
exports.size = "Size",
exports.transactions = "Transactions",
exports.total_sent = "Total Sent",
exports.total_received = "Total Received",
exports.confirmations = "Confirmations",
exports.total = "Total",
exports.bits = "Bits",
exports.nonce = "Nonce",
exports.new_coins = "New Coins",
exports.proof_of_stake = "PoS",
exports.initial_index_alert = "Indexing is currently incomplete, functionality is limited until index is up-to-date.",

exports.a_menu_showing = "Showing",
exports.a_menu_txs = "transactions",
exports.a_menu_all = "All",

exports.rl_received_coins = "Top 100 - Received Coins",
exports.rl_current_balance = "Top 100 - Current Balance",
exports.rl_received = "Received",
exports.rl_balance = "Balance",
exports.rl_wealth = "Wealth Distribution",
exports.rl_top25 = "Top 1-25",
exports.rl_top50 = "Top 26-50",
exports.rl_top75 = "Top 51-75",
exports.rl_top100 = "Top 76-100",
exports.rl_hundredplus = "101+",


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
exports.api_getmaxmoney = 'Returns the maximum possible money supply.',
exports.api_getmaxvote = 'Returns the maximum allowed vote for the current phase of voting.',
exports.api_getvote = 'Returns the current block reward vote setting.',
exports.api_getphase = 'Returns the current voting phase (\'Mint\', \'Limit\' or \'Sustain\').',
exports.api_getreward = 'Returns the current block reward, which has been decided democratically in the previous round of block reward voting.',
exports.api_getsupply = 'Returns the current money supply.',
exports.api_getnextrewardestimate = 'Returns an estimate for the next block reward based on the current state of decentralized voting.',
exports.api_getnextrewardwhenstr =  'Returns string describing how long until the votes are tallied and the next block reward is computed.',

// Markets view
exports.mkt_hours = "24 hours",
exports.mkt_view_chart = "View 24 hour summary",
exports.mkt_view_summary = "View 24 hour chart",
exports.mkt_no_chart = "Chart data is not available via markets API.",
exports.mkt_high = "High",
exports.mkt_low = "Low",
exports.mkt_volume = "Volume",
exports.mkt_top_bid = "Top Bid",
exports.mkt_top_ask = "Top Ask",
exports.mkt_last = "Last",
exports.mkt_yesterday = "Yesterday",
exports.mkt_change = "Change",
exports.mkt_sell_orders = "Sell Orders",
exports.mkt_buy_orders = "Buy Orders",
exports.mkt_price = "Price",
exports.mkt_amount = "Amount",
exports.mkt_total = "Total",
exports.mkt_trade_history = "Trade History",
exports.mkt_type = "Type",
exports.mkt_time_stamp = "Time Stamp",
// Heavy

exports.heavy_vote = "Vote",
    // Heavy rewards view
exports.heavy_title = "Reward/voting information",

exports.heavy_cap = "Coin Cap",
exports.heavy_phase = "Phase",
exports.heavy_maxvote = "Max Vote",
exports.heavy_reward = "Reward",
exports.heavy_current = "Current Reward",
exports.heavy_estnext = "Est. Next",
exports.heavy_changein = "Reward change in approximately",
exports.heavy_key = "Key",
exports.heavy_lastxvotes = "Last 20 votes",

exports.reloadLocale = function reloadLocale(locale) {
  // Discover where the locale file lives
  var localeFilename = locale;
  //console.log(localeFilename);
  localeFilename = "./" + localeFilename;
  //console.log('Loading locale: ' + localeFilename);
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