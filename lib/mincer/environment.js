/**
 *  class Environment
 *
 *  Subclass of [[Base]]
 **/


'use strict';


// stdlib
var inherits = require('util').inherits;


// 3rd-party
var _     = require('underscore');
var Trail = require('hike').Trail;


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
  var self = this;

  Base.call(this);

  // Create safe `Context` subclass to mutate
  prop(this, '__contextClass__', function () {
    Context.apply(this, arguments);
  });
  inherits(this.__contextClass__, Context);


  this.digestAlgorithm  = 'md5';
  this.version          = '';


  prop(this, '__trail__',             new Trail(root || '.'));
  prop(this, '__engines__',           Mincer.engines);
  prop(this, '__mimeTypes__',         cloneMimeTypes(Mincer.__mimeTypes__));
  prop(this, '__preprocessors__',     Mincer.preprocessors);
  prop(this, '__postprocessors__',    Mincer.postprocessors);
  prop(this, '__bundle_processors__', Mincer.bundleProcessors);


  _.each(Mincer.paths, function (path) {
    this.appendPath(path);
  }, this);


  _.each(this.engines, function (ext, klass) {
    this.addEngineToTrail(ext, klass);
  }, this);


  _.each(this.mimeTypes, function (ext, type) {
    this.__trail__.extensions.append(ext);
  }, this);


  Object.defineProperty(this, '__assets__', {value: {}, writable:  true});


  this.expireIndex();
};


inherits(Environment, Base);


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


Environment.prototype.expireIndex = function () {
  this.__assets__ = {};
};
