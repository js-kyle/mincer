/* global describe, it */


'use strict';


var assert = require('assert');


describe('Assets Pipeline', function () {

  var env = require('./environment')();

  it('should process asset with engines from right to left', function () {
    var asset = env.findAsset('pipeline/single_file');
    assert(asset.toString().match(/h1\s+{\s+background-image:/g));
    assert(asset.toString().match(/\/assets\/ixti-[a-f0-9]{32}.gif/));
  });

  it('should process macros', function () {
    var asset = env.findAsset('pipeline/macros');
    assert(asset.toString().match(/\/assets\/pipeline\/single_file-[a-f0-9]{32}.css/));
  });
});
