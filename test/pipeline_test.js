/* global describe, it */


"use strict";


var assert = require("assert");


describe("Assets Pipeline", function () {

  var env = require("./environment")();

  it("should process asset with engines from right to left", function (done) {
    env.findAsset("pipeline/single_file").compile(function (err, asset) {
      assert(asset.toString().match(/h1\s+{\s+background-image:/g));
      assert(asset.toString().match(/\/assets\/ixti-[a-f0-9]{32}.gif/));
      done(err);
    });
  });

});
