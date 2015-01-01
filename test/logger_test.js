/* global describe, it */


'use strict';


var sinon  = require('sinon');
var Mincer = require('..');
var logger = Mincer.logger;


describe('Logger', function () {

  it('should log', function () {
    var spy = {
      log: sinon.spy()
    };

    logger.use(spy);

    logger.log('test log');

    sinon.assert.calledOnce(spy.log);
  });

  it('should not log below level', function () {
    var spy = {
      log: sinon.spy()
    };

    logger.use(spy).level(logger.DEBUG_LEVEL);

    logger.log('test log');

    sinon.assert.notCalled(spy.log);
  });

  it('should log at set level', function () {
    var spy = {
      debug: sinon.spy()
    };

    logger.use(spy).level(logger.DEBUG_LEVEL);

    logger.debug('test log');

    sinon.assert.calledOnce(spy.debug);
  });

});
