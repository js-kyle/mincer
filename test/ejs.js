/*global describe, it, before*/

'use strict';

var assert  = require('assert')
  , path    = require('path')
  , fs      = require('fs')
  , vm      = require('vm')
  , EJS     = require('ejs')
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

describe('class EjsEngine < Template', function () {
  describe('Environment', function () {
    describe('#findAsset()', function () {
      it('should find assets with .ejs extension', function (done) {
        assert.doesNotThrow(function () {
          var assetName = 'variable-ejs'; /* js.ejs */
          assert.equal(path.resolve(__dirname + '/fixtures/app/assets/javascripts/' +
            assetName + '.js.ejs'),
            env.findAsset(assetName).pathname);
          done();
        });
      });
    });
  });

  describe('Asset [.js.ejs]', function () {
    describe('#compile()', function () {
      it('should compile properly', function (done) {
        var assetName = 'variable-ejs', /* js.ejs */
            myStrip = remove_trailing_spaces;
        assert.doesNotThrow(function () {
          var asset  = env.findAsset(assetName),
              source = fs.readFileSync(asset.pathname, 'utf8').trim(),
              options = { scope: {},
                          locals: {},
                          filename: asset.pathname,
                          client: true };
          asset.compile(function (err, asset) {
            if (err) { throw err; }
            assert.equal(myStrip(EJS.compile(source, options).call(options.scope).toString()),
                         myStrip(asset.toString()));
            done();
          });
        });
      });
    });
  });

  describe('Asset [.jst.ejs]', function () {
    describe('#compile()', function () {
      var assetName = 'templates/figure-ejs', /* jst.ejs */
          compiledAsset,
          scope = {},
          locals = {};
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
        var source = fs.readFileSync(compiledAsset.pathname, 'utf8').trim(),
            options = { scope: context,
                        locals: locals,
                        filename: compiledAsset.pathname,
                        client: true };

        assert.equal(EJS.render(source, options),
                     scope.JST[assetName].call(context, locals));
      });
    });
  });
});
