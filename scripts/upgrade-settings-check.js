var fs = require('fs');
var jsonminify = require('jsonminify');
// Discover where the settings file lives
var settingsFilename = "settings.json";
settingsFilename = "./" + settingsFilename;

var settingsStr;
try{
  //read the settings sync
  settingsStr = fs.readFileSync(settingsFilename).toString();
} catch(e){
  console.warn('No settings file \"%s\" found. Continuing using defaults!', settingsFilename);
}

// try to parse the settings
var settings;
var validSettings= [
    'title',
    'address',
    'coin',
    'symbol',
    'logo',
    'favicon',
    'theme',
    'port',
    'dbsettings',
    'update_timeout',
    'check_timeout',
    'wallet',
    'language',
    'confirmations',
    'index',
    'api',
    'markets',
    'richlist',
    'movement',
    'genesis_tx',
    'genesis_block',
    'heavy',
    'txcount',
    'show_sent_received',
    'supply',
    'nethash',
    'nethash_units',
    'display',
    'social',
    'commands_needed',
    'peers',
    'decimal_places'
];
var removedSettings=[
    'locale',
    'twitter',
    'facebook',
    'googleplus',
    'youtube',
    'bitcointalk',
    'github',
    'slack',
    'website',
    'labels'
];
var changedSettings={
    "wallet":{'user':"username", 'pass':"password"},
    "locale":"language",
    "coin_info": {"masternode_required": "masternodes"}
};

//https://love2dev.com/blog/javascript-remove-from-array/#remove-from-array-splice-value
function arrayRemove(arr, value) {

    return arr.filter(function(ele){
        return ele != value;
    });
 
}
//

try {
  if(settingsStr) {
    settingsStr = jsonminify(settingsStr).replace(",]","]").replace(",}","}");
    settings = JSON.parse(settingsStr);
  }
}catch(e){
  console.error('There was an error processing your settings.json file: '+e.message);
  process.exit(1);
}

console.log("Checking if all values in Settings have the first letter lowercased.");
console.log("+-+-+-+-+");
console.log("+-+-+-+-+");
var failedCheck = []; //not used, maybe later
//loop trough the settings
for(var i in settings)
{
  //test if the setting start with a low character
  if(i.charAt(0).search("[a-z]") !== 0)
  {
    console.warn("Settings should start with a low character: '" + i + "'");
  }
}
console.log("Finsihed checking casings.");
console.log("+-+-+-+-+");
console.log("\x1b[44m%s\x1b[0m","+-+-+-+-+Checking if any settings have been changed+-+-+-+-+");
console.log("+-+-+-+-+");
//loop trough the settings
for(var i in settings)
{
  if(Object.keys(changedSettings).includes(i)){
    if(typeof(settings[i])=="object")
    {
        for(var k in settings[i])
        {
            if(Object.keys(changedSettings[i]).includes(k)){
                console.log("\'%s\' has been changed from \'%s\' to \'%s\'. Please update this in your Settings.json.", k, k, changedSettings[i][k]);
            }
        }
    }else{
        console.log("\'%s\' has been changed from \'%s\' to \'%s\'. Please update accordingly.", i, i, changedSettings[i]);
    }
  }
}
console.log("Finished checking for changed settings.");
console.log("+-+-+-+-+");
console.log("\x1b[44m%s\x1b[0m","+-+-+-+-+Checking for any removed settings.+-+-+-+-+");
console.log("+-+-+-+-+");
//loop trough the settings
for(var i in settings)
{
  if(removedSettings.includes(i)){
    console.log("\'%s\' has been removed from Settings.json and is no longer valid", i);
  }
}
console.log("Finished checking for removed Settings");
console.log("+-+-+-+-+");
console.log("\x1b[44m%s\x1b[0m","+-+-+-+-+Checking for new Settings that aren't present yet+-+-+-+-+",);
console.log("+-+-+-+-+");
//loop trough the settings
for(var i in settings)
{
  if(validSettings.includes(i)){
      for(k=0; k<validSettings.length; k++){
          if(validSettings[k] == i){
              validSettings = arrayRemove(validSettings, i);
          }
      }
  }
}
for(i=0; i<validSettings.length; i++){
    console.log("\'%s\' has been added to Settings.json and was not found in your settings configuration. Please add it according to the template example.", validSettings[i]);
}
console.log("Finished checking for new settings");
console.log("+-+-+-+-+");
console.log("+-+-+-+-+");