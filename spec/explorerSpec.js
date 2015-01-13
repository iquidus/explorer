describe('explorer', function() {
  var lib = require('../lib/explorer');
  var data = require('../test/data.js');

  describe('convert_to_satoshi', function() {

    it('should be able to convert round numbers', function() {
      lib.convert_to_satoshi(500, function(amount_sat){
        expect(amount_sat).toEqual(50000000000);
        
      });
    });

    it('should be able to convert decimals above 1', function() {
      lib.convert_to_satoshi(500.12564, function(amount_sat){
        expect(amount_sat).toEqual(50012564000);
        
      });
    });

    it('should be able to convert decimals below 1', function() {
      lib.convert_to_satoshi(0.0005, function(amount_sat){
        expect(amount_sat).toEqual(50000);
        
      });
    });
  });

  describe('is_unique', function() {
  
    var arrayStrMap = [ 
      {'addresses' : 'XsF8k8s5CoS3XATqW2FkuTsznbJJzFAC2U'},
      {'addresses' : 'XsF8k8s5C14FbhqW2FkuATsznFACAfVhUn'},
      {'addresses' : 'XsF8k8s5CoAF5gTqW2FkuTsznbJJzhkj5A'},
      {'addresses' : 'XfuW2K9QiGMSsq5eXgtimEQvTvz9dzBCzb'}
    ];

    var arrayArrMap = [ 
      {'addresses' : ['XsF8k8s5CoS3XATqW2FkuTsznbJJzFAC2U']},
      {'addresses' : ['XsF8k8s5C14FbhqW2FkuATsznFACAfVhUn']},
      {'addresses' : ['XsF8k8s5CoAF5gTqW2FkuTsznbJJzhkj5A']},
      {'addresses' : ['XfuW2K9QiGMSsq5eXgtimEQvTvz9dzBCzb']}
    ];

    it('should return index of matching string object', function() {
      lib.is_unique(arrayStrMap, arrayStrMap[2].addresses, function(unique, index){
        expect(index).toEqual(2);
        expect(unique).toEqual(false);
        
      });
    });

    it('should return index of matching array object', function() {
      lib.is_unique(arrayArrMap, arrayArrMap[2].addresses, function(unique, index){
        expect(index).toEqual(2);
        expect(unique).toEqual(false);
        
      });
    });

    it('should return true if no matching string object', function() {
      lib.is_unique(arrayStrMap, 'unique', function(unique, index){
        expect(index).toEqual(null);
        expect(unique).toEqual(true);
        
      });
    });

    it('should return true if no matching array object', function() {
      lib.is_unique(arrayArrMap, ['unique'], function(unique, index){
        expect(index).toEqual(null);
        expect(unique).toEqual(true);
        
      });
    });
  });

  describe('prepare_vout', function() {
    

    var originalTimeout;
    beforeEach(function() {
      originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
      jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
    });

    it('should ignore nonstandard outputs', function(done) {
      lib.prepare_vout(data.txA().vout, data.txA().txid, function(prepared) {
        expect(prepared.length).toEqual(152);
        done();  
      });
    });

    it('should maintain order', function(done) {
      lib.prepare_vout(data.txA().vout, data.txA().txid, function(prepared) {
        expect(prepared[150].amount).toEqual(2.1006);
        expect(prepared[150].addresses).toEqual(['XyPreJfnUxSSY1QbYqQxDXpymc26VFQPDV']);
        done();  
      });
    });

    afterEach(function() {
      jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
    });

  });

  describe('calculate_total', function() {
    var originalTimeout;

    beforeEach(function() {
      originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
      jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
    });

    it('should calculate correct total', function(done) {
      lib.prepare_vout(data.txA().vout, data.txA().txid, function(prepared) {
        lib.calculate_total(prepared, function(total) {
          expect(total).toEqual(700200000);
          done();  
        });
      });
    });

    afterEach(function() {
      jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
    });
  });

  describe('prepare_vin', function() {
    var originalTimeout;

    beforeEach(function() {
      originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
      jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
    });

    it('should return array of correct length', function(done) {
      lib.prepare_vin(data.txB(), function(prepared) {
        expect(prepared.length).toEqual(18);
        done();  
      });
    });

    it('should get correct input addresses', function(done) {
      lib.prepare_vin(data.txB(), function(prepared) {
        expect(prepared[3].amount).toEqual(10.00000001);
        expect(prepared[3].addresses).toEqual('XjYC7q5QwG7dGnytYDoCURhL4CATj6WQhZ');
        done();  
      });
    });

    afterEach(function() {
      jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
    });
  });
});