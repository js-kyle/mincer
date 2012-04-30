/** internal
 *  class Index
 *
 *  Subclass of [[Base]]
 *
 *  `Index` is a special cached version of [[Environment]].
 *
 *  The expection is that all of its file system methods are cached
 *  for the instances lifetime. This makes `Index` much faster. This
 *  behavior is ideal in production environments where the file system
 *  is immutable.
 *
 *  `Index` should not be initialized directly. Instead use
 *  [[Environment#index]].
 **/


'use strict';


// internal
var Base            = require('./base');
var prop            = require('./common').prop;
var getter          = require('./common').getter;
var cloneMimeTypes  = require('./common').cloneMimeTypes;


/**
 *  new Index(environment)
 **/
var Index = module.exports = function Index(environment) {
  Base.call(this);

  prop(this, 'environment', environment);

  this.__digestAlgorithm__  = environment.digestAlgorithm;
  this.__version__          = environment.version;

  prop(this, '__contextClass__',      environment.__contextClass__);
  prop(this, '__trail__',             environment.__trail__.index);
  prop(this, '__engines__',           environment.engines);
  prop(this, '__mimeTypes__',         cloneMimeTypes(environment.__mimeTypes__));
  prop(this, '__preprocessors__',     environment.preprocessors);
  prop(this, '__postprocessors__',    environment.postprocessors);
  prop(this, '__bundle_processors__', environment.bundleProcessors);


  Object.defineProperty(this, '__assets__', {value: {}, writable:  true});
  Object.defineProperty(this, '__digests__', {value: {}, writable:  true});
};


require('util').inherits(Index, Base);


getter(Index.prototype, 'index', function () {
  return this;
});


Index.prototype.fileDigest = function (pathname) {
  if (undefined === this.__digests__[pathname]) {
    this.__digests__[pathname] = Base.prototype.fileDigest.call(this, pathname);
  }

  return this.__digests__[pathname];
};


Index.prototype.findAsset = function (pathname, options) {
  var asset, logical_path_cache_key, full_path_cache_key;

  options.bundle = (undefined === options.bundle) ? true : options.bundle;

  if (this.__assets__[this.cacheKeyFor(pathname, options)]) {
    return this.__assets__;
  }

  asset = Base.prototype.findAsset.apply(this, arguments);

  if (asset) {
    logical_path_cache_key  = this.cacheKeyFor(pathname, options);
    full_path_cache_key     = this.cacheKeyFor(asset.pathname, options);

    // Cache on Index
    this.__assets__[logical_path_cache_key] =
    this.__assets__[full_path_cache_key]    = asset;

    // Push cche upstream to Environment
    this.environment.__assets__[logical_path_cache_key] =
    this.environment.__assets__[full_path_cache_key]    = asset;

    return asset;
  }
};


Index.prototype.expireIndex = function () {
  throw new Error("Can't modify immutable index");
};
