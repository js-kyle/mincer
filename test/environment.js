/*global describe, it, before*/

'use strict';

var Mincer  = require('../lib/mincer')
  , env;

function precompile(cached, done) {
  var cb = function(err, data) {
    if (err) { return done(err); }
    if (data.assets['precompile_test.js'] !== null) {
      done();
    } else {
      done("Failed to precompile");
    }
  };
  if (cached === false) {
    env.precompile(['precompile_test.js'], cb);
  } else {
    env.precompile(['precompile_test.js'], {cachedPaths: true}, cb);
  }
}

// Compile time should be reduced by at least a factor of 5
// when paths have been cached.
function test_precompile(cached, done) {
  var start1 = new Date
    , precompile1 = 0
    , precompile2 = 0;
  precompile(cached, function(err) {
    if (err) { return done(err); }
    precompile1 = new Date - start1;
    var start2 = new Date;
    precompile(cached, function(err) {
      if (err) { return done(err); }
      precompile2 = new Date - start2;
      console.log ("Uncached precompile:", precompile1, "ms");
      console.log ("Cached precompile:", precompile2, "ms");
      var faster = precompile2 < (precompile1 / 5);
      if (faster && cached) {
        done();
      } else if (!faster && !cached) {
        done();
      } else if (!faster && cached) {
        done("Cached precompile didn't compile fast enough to be cached.");
      } else if (faster && !cached) {
        done("Cached precompile compiled too fast to not be cached.");
      }
    });
  });
}

describe('class Environment', function () {

  before(function(){
    env = new Mincer.Environment(__dirname + '/fixtures');
    var assetPath = 'app/assets/javascripts';
    env.appendPath(assetPath);
  });

  describe('Environment', function () {
    describe('#precompile()', function () {
      it('should precompile and cache paths', function (done) {
        test_precompile(true, done);
      });
      it('should precompile without caching paths', function (done) {
        test_precompile(false, done);
      });
    });
  });
});
