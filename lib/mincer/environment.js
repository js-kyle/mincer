/**
 *  class Environment
 *
 *  Subclass of [[Base]]
 **/


'use strict';


// 3rd-party
var Trail = require('hike').Trail;


// internal
var Mincer = require('../mincer');
var Base   = require('./base');
var Index  = require('./index');
var getter = require('./common').getter;
var prop   = require('./common').prop;


/**
 *  new Environment(root)
 **/
var Environment = module.exports = function Environment(root) {
  this.trail = new Trail(root || '.');

  prop(this, '__engines__', Mincer.engines);
  Base.call(this);
};


require('util').inherits(Environment, Base);


/**
 *  Environment#index -> Index
 *
 *  Returns a cached version of the environment.
 *
 *  All its file system calls are cached which makes `index` much
 *  faster. This behavior is ideal in production since the file
 *  system only changes between deploys.
 **/
getter(Environment.prototype, 'index', function () {
  return new Index(this);
});


Environment.prototype.findAsset = function (path, options) {
  var asset;

  options = options || {};
  options.bundle = (undefined === options.bundle) ? true : !!options.bundle;

  // Ensure inmemory cached assets are still fresh on every lookup
  asset = this.__assets__[this.cacheKeyFor(path, options)];
  if (asset && asset.isFresh(this)) {
    return asset;
  }

  // Cache is pushed upstream by Index#find_asset
  return this.index.findAsset(path, options);
};
