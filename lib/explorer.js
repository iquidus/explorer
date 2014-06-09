var request = require('request');
var settings = require('./settings');

var base_url = "http://127.0.0.1:" + settings.port + "/api/";

  module.exports = {
  get_hashrate: function(cb) {
    var uri = base_url + "getnetworkhashps";
    request({uri: uri, json: true}, function (error, response, body) {
      return cb(body);
    });
  },

  get_difficulty: function(cb) {
    var uri = base_url + "getdifficulty";
    request({uri: uri, json: true}, function (error, response, body) {
      return cb(body);
    });
  },

  get_connectioncount: function(cb) {
    var uri = base_url + "getconnectioncount";
    request({uri: uri, json: true}, function (error, response, body) {
      return cb(body);
    });
  },

  get_blockcount: function(cb) {
    var uri = base_url + "getblockcount";
    request({uri: uri, json: true}, function (error, response, body) {
      return cb(body);
    });
  },

  get_blockhash: function(height, cb) {
    var str = base_url + "getblockhash?height=" + height;
    request({uri: str, json: true}, function (error, response, body) {
      return cb(body);
    });
  },

  get_block: function(hash, cb) {
    var str = base_url + "getblock?hash=" + hash;
    request({uri: str, json: true}, function (error, response, body) {
      return cb(body);
    });
  },

  get_rawtransaction: function(hash, cb) {
    var str = base_url + "getrawtransaction?txid=" + hash + "&decrypt=1";
    request({uri: str, json: true}, function (error, response, body) {
      return cb(body);
    });
  },
};