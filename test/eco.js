var assert = require('assert'),
    path   = require('path'),
    fs     = require('fs'),
    ECO    = require('eco'),
    Mincer = require('../lib/mincer');

Mincer.logger.use(console); // provide logger backend

var compile = function(asset, callback) {
  env.findAsset(asset).compile(function(err, asset) {
    if (err) { throw err; }
    if (typeof callback === "function") { callback(asset); }
  });
};

var env = new Mincer.Environment(__dirname + '/fixtures'),
    assetPath = 'app/assets/javascripts',
    assetName = 'variable';

env.appendPath(assetPath);

function remove_trailing_spaces(str) {
  return str.split("\n").map(function(l){
    return l.replace(/(;*\s*;*)/gi, '').replace(/(\/\*(.*)\*\/)/gi, '');
  }).join('\n').trim();
}

describe('Environment', function() {
  describe('#findAsset()', function() {
    it('should find assets with .eco extension', function(done) {
      assert.doesNotThrow(function() {
        assert.equal(path.resolve(__dirname+'/fixtures/app/assets/javascripts/'+assetName+'.js.eco'),
               env.findAsset(assetName).pathname);
        done();
      });
    });
  });
});

describe('Asset', function() {
  describe('#compile()', function() {
    it('should compile when using eco', function(done) {
      assert.doesNotThrow(function() {
        var asset  = env.findAsset(assetName),
            source = fs.readFileSync(asset.pathname, 'utf8').trim();
        asset.compile(function(err, asset) {
          if (err) { throw err; }
          assert.equal(remove_trailing_spaces(ECO.precompile(source)),
                       remove_trailing_spaces(asset.toString()));
          done();
        });
      });
    });
  });
});