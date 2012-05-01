/**
 *  class Environment
 *
 *  Subclass of [[Base]]
 **/


'use strict';


// 3rd-party
var _       = require('underscore');
var Trail   = require('hike').Trail;
var winston = require('winston');


// internal
var Mincer          = require('../mincer');
var Base            = require('./base');
var Context         = require('./context');
var Index           = require('./index');
var getter          = require('./common').getter;
var prop            = require('./common').prop;
var cloneMimeTypes  = require('./common').cloneMimeTypes;


/**
 *  new Environment(root)
 **/
var Environment = module.exports = function Environment(root) {
  Base.call(this);

  // set digestAlgorithm an environment version
  this.digestAlgorithm  = 'md5';
  this.version          = '';

  // create a safe `Context` subclass to mutate
  prop(this, 'ContextClass',          Context.subclass);

  // define internal properties
  prop(this, '__trail__',             new Trail(root || '.'));
  prop(this, '__engines__',           Mincer.getEngines());
  prop(this, '__mimeTypes__',         Mincer.registeredMimeTypes);
  prop(this, '__preProcessors__',     Mincer.getPreProcessors());
  prop(this, '__postProcessors__',    Mincer.getPostProcessors());
  prop(this, '__bundleProcessors__',  Mincer.getBundleProcessors());

  // append paths
  _.each(Mincer.paths, function (path) {
    this.appendPath(path);
  }, this);

  // append default engines
  _.each(this.engines, function (ext, klass) {
    this.addEngineToTrail(ext, klass);
  }, this);

  // register default mimeType extensions
  _.each(this.__mimeTypes__.types, function (ext, type) {
    this.__trail__.extensions.append(ext);
  }, this);

  // internal cache
  prop(this, '__assets__', {}, {writable: true});

  // force drop cache
  this.expireIndex();
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


/**
 *  Environment#findAsset(path[, options]) -> Asset
 *
 *  Proxies call to [[Index#findAsset]] of the one time [[Environment#index]]
 *  instance. [[Index#findAsset]] automatically pushes cache here.
 **/
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


/** internal
 *  Environment#expireIndex() -> Void
 *
 *  Reset assets internal cache.
 **/
Environment.prototype.expireIndex = function () {
  this.__assets__ = {};
};
