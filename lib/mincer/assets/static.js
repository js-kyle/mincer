/** internal
 *  class StaticAsset
 *
 *  Represents static asset the one that has no any processors associated with.
 *
 *
 *  ##### SUBCLASS OF
 *
 *  [[Asset]]
 **/


'use strict';


// stdlib
var fs = require('fs');


// internal
var prop    = require('../common').prop;
var getter  = require('../common').getter;
var Asset   = require('./asset');


////////////////////////////////////////////////////////////////////////////////


/**
 *  new StaticAsset()
 *
 *  See [[Asset.new]] for details.
 **/
var StaticAsset = module.exports = function StaticAsset() {
  Asset.apply(this, arguments);
  prop(this, 'type', 'static');
};


require('util').inherits(StaticAsset, Asset);


// See apidoc of [[Asset#buffer]]
getter(StaticAsset.prototype, 'buffer', function () {
  // No caching to avoid memory bloating by default.
  // Caching might be implemented on the higher level (e.g. in [[Server]])
  // by simply setting `__buffer__` property.
  return this.__buffer__ || fs.readFileSync(this.pathname);
});


// See apidoc of [[Asset#source]]
getter(StaticAsset.prototype, 'source', function () {
  return this.buffer.toString('binary');
});
