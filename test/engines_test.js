/* global describe, it */


"use strict";


var assert = require("assert");


describe("Engines", function () {

  var env = require("./environment")();

  describe("EJS", function () {
    it("should process javascripts", function () {
      var asset = env.findAsset("ejs_engine/javascript");
      assert(asset.toString().match(/\/assets\/ixti-[a-f0-9]{32}.gif/));
      assert(asset.toString().match(/data:image\/gif;base64/));
    });

    it("should process stylesheets", function () {
      var asset = env.findAsset("ejs_engine/stylesheet");
      assert(asset.toString().match(/\/assets\/ixti-[a-f0-9]{32}.gif/));
      assert(asset.toString().match(/data:image\/gif;base64/));
    });
  });

});
