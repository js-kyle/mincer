/*jshint evil:true, strict:false*/
/*global describe:true, it:true, before:true */

var assert  = require('assert')
  , path    = require('path')
  , fs      = require('fs')
  , vm      = require('vm')
  , ECO     = require('eco')
  , _       = require('underscore')
  , Mincer  = require('../lib/mincer');

Mincer.logger.use(console); // provide logger backend


var env = new Mincer.Environment(__dirname + '/fixtures');


env.appendPath("app/assets/javascripts");
env.appendPath("app/assets/images");


function remove_trailing_spaces(str) {
  return str.split("\n").map(function(l){
    // Strip all comments, trailing spaces and ';' at the and of line
    // to make easy to compare javascript code
    return l.replace(/(;*\s*;*)?(\/\*(.*)\*\/)?(;*\s*;*)?$/gi, '');
  }).join('\n').trim();
}

describe('Environment', function() {
  describe('#findAsset()', function() {
    it('should find assets with .eco extension', function(done) {
      assert.doesNotThrow(function() {
        var assetName = 'variable'; /* js.eco */
        assert.equal(path.resolve(__dirname+'/fixtures/app/assets/javascripts/'+
          assetName+'.js.eco'),
          env.findAsset(assetName).pathname);
        done();
      });
    });
  });

describe('Asset', function() {
  describe('#compile()', function() {
    it('should compile properly', function(done) {
      var assetName = 'variable', /* js.eco */
          myStrip = remove_trailing_spaces;
      assert.doesNotThrow(function() {
        var asset  = env.findAsset(assetName),
            source = fs.readFileSync(asset.pathname, 'utf8').trim();
        asset.compile(function(err, asset) {
          if (err) { throw err; }
          assert.equal(myStrip(ECO.compile(source).call({}).toString()),
                       myStrip(asset.toString()));
          done();
        });
      });
    });
  });

  describe('#compile() with JST', function() {
    var assetName = 'figure', /* jst.eco */
        compiledAsset,
        callable,
        scope = {},
        context = {
          text: 'Caption',
          asset_data_uri: function(name) { return name; }
        };

    before(function(done){
      assert.doesNotThrow(function() {
        var asset  = env.findAsset(assetName),
            source = fs.readFileSync(asset.pathname, 'utf8').trim();
        asset.compile(function(err, asset) {
          if (err) { throw err; }
          compiledAsset = asset;
          callable = new Function(asset.toString());
          callable.call(scope);
          done();
        });
      });

    it('should generate a JST object in the scope', function(done) {
      assert.ok(scope.JST, 'a JST object must be generated, no JST found');
      done();
    });

    it('should generate a template inside JST object', function(done) {
      assert.ok(scope.JST[assetName],
        'a member named by the assetName without extension, must be '+
        'generated inside JST object, no JST['+ assetName + '] found.');
      done();
    });

    it('should generate a template function inside JST object', function(done) {
      assert.ok(scope.JST[assetName] instanceof Function,
        'the member of JST object named by the assetName without extension '+
        'must be a function');
      done();
    });

    it('should generate a template function that renders correctly', function(done) {
      var source = fs.readFileSync(compiledAsset.pathname, 'utf8').trim();
      assert.equal(ECO.render(source, context),
                   scope.JST[assetName](context));
      done();
    });
  });
});
