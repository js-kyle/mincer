/*global describe, it, before*/

'use strict';

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
  return str.split("\n").map(function (l) {
    // Strip all comments, trailing spaces and ';' at the and of line
    // to make easy to compare javascript code
    return l.replace(/(;*\s*;*)?(\/\*(.*)\*\/)?(;*\s*;*)?$/gi, '');
  }).join('\n').trim();
}

describe('class EcoEngine < Template', function () {
  describe('Environment', function () {
    describe('#findAsset()', function () {
      it('should find assets with .eco extension', function (done) {
        assert.doesNotThrow(function () {
          var assetName = 'variable-eco'; /* js.eco */
          assert.equal(path.resolve(__dirname + '/fixtures/app/assets/javascripts/' +
            assetName + '.js.eco'),
            env.findAsset(assetName).pathname);
          done();
        });
      });
    });
  });

  describe('Asset [.js.eco]', function () {
    describe('#compile()', function () {
      var asset,
          source,
          assetName = 'variable-eco',
          myStrip = remove_trailing_spaces;

      before(function (done) {
        assert.doesNotThrow(function () {
          asset  = env.findAsset(assetName);
          fs.readFile(asset.pathname, 'utf8', function (err, data) {
            if (err) { throw err; }
            source = data.trim();
            done();
          });
        });
      });

      it('should compile properly', function (done) {
        assert.doesNotThrow(function () {
          asset.compile(function (err, asset) {
            if (err) { throw err; }
            assert.equal(myStrip(ECO.render(source, {}).toString()),
                         myStrip(asset.toString()));
            done();
          });
        });
      });
    });
  });

  describe('Asset [.jst.eco]', function () {
    describe('#compile()', function () {
      var assetName = 'templates/figure-eco', /* jst.eco */
          compiledAsset,
          scope = {};
      var context = {
        id: 1,
        text: 'Caption',
        asset_data_uri: function (name) { return name; }
      };

      before(function (done) {
        assert.doesNotThrow(function () {
          var asset  = env.findAsset(assetName);
          asset.compile(function (err, asset) {
            if (err) { throw err; }
            compiledAsset = asset;
            vm.runInNewContext(asset.toString(), scope, 'asset.vm');
            done();
          });
        });
      });

      it('should generate a JST object in the scope', function () {
        assert.ok(scope.JST, 'a JST object must be generated, no JST found');
      });

      it('should generate a template inside JST object', function () {
        assert.ok(scope.JST[assetName],
          'a member named by the assetName without extension, must be ' +
          'generated inside JST object, no JST[' + assetName + '] found.');
      });

      it('should generate a template function inside JST object', function () {
        assert.ok(_.isFunction(scope.JST[assetName]),
          'the member of JST object named by the assetName without extension ' +
          'must be a function');
      });

      it('should generate a template function that renders correctly', function () {
        var source = fs.readFileSync(compiledAsset.pathname, 'utf8').trim();
        assert.equal(ECO.render(source, context),
                     scope.JST[assetName](context));
      });
    });
  });
});
