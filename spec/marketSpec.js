describe('market', function() {
  var poloniex = require('../lib/poloniex');

  describe('poloniex', function() {
    beforeEach(function() {
      originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
      jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
    });

    it('should return trade history', function(done){
      poloniex.get_trades('DRK', 'BTC', function(err, trades) {
        expect(err).toEqual(null);
        expect(trades.length).toEqual(200);
        done();
      });
    });

    it('should return orderbook', function(done){
      poloniex.get_orders('DRK', 'BTC', function(err, orders) {
        expect(err).toEqual(null);
        expect(orders.asks.length).toEqual(50);
        expect(orders.bids.length).toEqual(50);
        expect(orders.isFrozen).toEqual('0');
        done();
      });
    });

    it('should return summary', function(done){
      poloniex.get_summary('DRK', 'BTC', function(err, summary) {
        expect(err).toEqual(null);
        expect(summary.isFrozen).toEqual('0');
        done();
      });
    });

    it('should return chartdata', function(done){
      poloniex.get_chartdata('DRK', 'BTC', 0, function(err, chartdata) {
        expect(err).toEqual(null);
        expect(chartdata.length).toBeGreaterThan(10);
        done();
      });
    });

    afterEach(function() {
      jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
    });
  });
});
  