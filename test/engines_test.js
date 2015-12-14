/* global describe, it, after */

'use strict';

var assert = require('assert');
var fs = require('fs');
var path = require('path');

function assetPath(filename) {
  return path.join(__dirname, 'fixtures', filename);
}

function copySync(src, dest) {
  fs.writeFileSync(dest, fs.readFileSync(src));
}

function bumpMtimeSync(pathname) {
  var stat = fs.statSync(pathname);
  var oneSecond = 1000;
  // "time_t provides times accurate to one second."
  // http://en.wikipedia.org/wiki/Stat_%28system_call%29#Time_granularity
  var newMtime = new Date(stat.mtime.getTime() + oneSecond);
  fs.utimesSync(pathname, stat.atime, newMtime);
}

describe('Engines', function () {
  var env = require('./environment')();
  var Mincer = require('..');

  describe('EJS', function () {
    it('should process javascripts', function () {
      var asset = env.findAsset('ejs_engine/javascript');
      assert(asset.toString().match(/\/assets\/ixti-[a-f0-9]{32}.gif/));
      assert(asset.toString().match(/data:image\/gif;base64/));
    });

    it('should process stylesheets', function () {
      var asset = env.findAsset('ejs_engine/stylesheet');
      assert(asset.toString().match(/\/assets\/ixti-[a-f0-9]{32}.gif/));
      assert(asset.toString().match(/data:image\/gif;base64/));
    });
  });

  describe('JST', function () {
    describe('with EJS backend', function () {
      it('should compile to a JS function', function () {
        var asset = env.findAsset('jst_engine/ejs/template');
        assert(asset.toString().match(/this\.JST/));
        assert(asset.toString().match(/__output\.push/));
      });
    });

    describe('with JADE backend', function () {
      it('should compile to a JS function', function () {
        var asset = env.findAsset('jst_engine/jade/template');
        assert(asset.toString().match(/this\.JST/));
        assert(asset.toString().match(/buf\.push/));
        assert(asset.toString().match(/template/));
        assert(asset.toString().match(/included/));
      });
    });
  });

  describe('LESS', function () {
    it('should support context helpers', function () {
      var asset = env.findAsset('less_engine/stylesheet');
      assert(asset.toString().match(/\/assets\/ixti-[a-f0-9]{32}.gif/));
      assert(asset.toString().match(/data:image\/gif;base64/));
    });
  });

  describe('SASS', function () {
    var variablesPath = assetPath('sass_engine/_variables.css.scss');

    after(function() {
      if (fs.existsSync(variablesPath)) {
        fs.unlinkSync(variablesPath);
      }
    });

    it('should process stylesheets', function () {
      copySync(assetPath('sass_engine/_variables.css.scss.v1'), variablesPath);

      var asset = env.findAsset('sass_engine/stylesheet');
      assert(asset.toString().match(/\.foo\s+\.bar\s*\{/));
      assert(asset.toString().match(/\.column\s+\{\s+width:\s*30px/));
    });

    it('should process changes to stylesheets', function () {
      copySync(assetPath('sass_engine/_variables.css.scss.v2'), variablesPath);
      bumpMtimeSync(variablesPath);

      var asset = env.findAsset('sass_engine/stylesheet');
      assert(asset.toString().match(/\.foo\s+\.bar\s*\{/));
      assert(asset.toString().match(/\.column\s+\{\s+width:\s*40px/));
    });

    it('should support context helpers', function () {
      var asset = env.findAsset('sass_engine/helpers');
      assert(asset.toString().match(/\/assets\/ixti-[a-f0-9]{32}.gif/));
      assert(asset.toString().match(/data:image\/gif;base64/));
    });

    it('should be configurable', function () {
      Mincer.SassEngine.configure({ outputStyle: 'compressed' });
      bumpMtimeSync(assetPath('sass_engine/grid.css.scss'));

      var asset = env.findAsset('sass_engine/grid');
      assert(asset.toString().match(/\.column\{width:40px/));
    });

    it('should work with macros', function () {
      var asset = env.findAsset('sass_engine/with_macros');

      assert(asset.toString().match(/min-width:\s*4px/));
      assert(asset.toString().match(/max-width:\s*16px/));
    });
  });
});
