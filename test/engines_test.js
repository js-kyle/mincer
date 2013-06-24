/* global describe, it */


"use strict";


var assert = require("assert");


describe("Engines", function () {

  var env = require("./environment")();

  describe("EJS", function () {
    it("should process javascripts", function (done) {
      env.findAsset("ejs_engine/javascript").compile(function (err, asset) {
        assert(asset.toString().match(/\/assets\/ixti-[a-f0-9]{32}.gif/));
        assert(asset.toString().match(/data:image\/gif;base64/));
        done(err);
      });
    });

    it("should process stylesheets", function (done) {
      env.findAsset("ejs_engine/stylesheet").compile(function (err, asset) {
        assert(asset.toString().match(/\/assets\/ixti-[a-f0-9]{32}.gif/));
        assert(asset.toString().match(/data:image\/gif;base64/));
        done(err);
      });
    });
  });

});
