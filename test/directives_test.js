/* global describe, it */


'use strict';


var assert = require('assert');


describe('Directives', function () {

  var env = require('./environment')();

  describe('Glob', function () {
    it('should include files based on globs', function () {
      var asset = env.findAsset('directive_glob/glob');
      assert(asset.toString().match(/first_file/));
      assert(asset.toString().match(/second_file/));
    });
  });

  describe('Tree', function () {
    it('should include files based on tree', function () {
      var asset = env.findAsset('directive_glob/tree');
      assert(asset.toString().match(/first_file/));
      assert(asset.toString().match(/second_file/));
    });
  });
});
