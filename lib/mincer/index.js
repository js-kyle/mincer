/** internal
 *  class Index
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
 *
 *
 *  ##### SUBCLASS OF
 *
 *  [[Base]]
 **/


'use strict';


// internal
var Base            = require('./base');
var prop            = require('./common').prop;
var getter          = require('./common').getter;
//var cloneMimeTypes  = require('./common').cloneMimeTypes;


////////////////////////////////////////////////////////////////////////////////


/*:nodoc:*
 *  new Index(environment)
 **/
var Index = module.exports = function Index(environment) {
  Base.call(this);

  // some protected properties
  prop(this, 'environment',           environment);
  prop(this, 'ContextClass',          environment.ContextClass);

  // some private properties
  prop(this, '__trail__',             environment.__trail__.index);
  prop(this, '__cache__',             environment.__cache__);
  prop(this, '__engines__',           environment.getEngines());
  prop(this, '__mimeTypes__',         environment.registeredMimeTypes);
  prop(this, '__preProcessors__',     environment.getPreProcessors());
  prop(this, '__postProcessors__',    environment.getPostProcessors());
  prop(this, '__bundleProcessors__',  environment.getBundleProcessors());
  prop(this, '__compressors__',       environment.getCompressors());
  prop(this, '__configurations__',    environment.getConfigurations());
  prop(this, '__jsCompressor__',      environment.__jsCompressor__);
  prop(this, '__cssCompressor__',     environment.__cssCompressor__);

  // make some internal values immutable
  prop(this, '__digestAlgorithm__',   environment.digestAlgorithm);
  prop(this, '__version__',           environment.version);

  // internal cache
  prop(this, '__assets__',            {}, {writable:  true});
  prop(this, '__digests__',           {}, {writable:  true});
};


require('util').inherits(Index, Base);


/**
 *  Index#index -> Index
 *
 *  Self-reference to provide same interface as in [[Environment]].
 **/
getter(Index.prototype, 'index', function () {
  return this;
});


/**
 *  Index.getFileDigest(pathname) -> crypto.Hash
 *
 *  Cached version of [[Base#getFileDigest]].
 **/
Index.prototype.getFileDigest = function (pathname) {
  if (undefined === this.__digests__[pathname]) {
    this.__digests__[pathname] = Base.prototype.getFileDigest.call(this, pathname);
  }

  return this.__digests__[pathname];
};


var _findAsset = Base.prototype.findAsset;


/**
 *  Index#findAsset(pathname[, options]) -> Asset
 *
 *  Caches calls to [[Base#findAsset]].
 *  Pushes cache to the upstream environment as well.
 **/
Index.prototype.findAsset = function (pathname, options) {
  var asset, logical_cache_key, fullpath_cache_key;

  options           = options || {};
  options.bundle    = (undefined === options.bundle) ? true : options.bundle;
  logical_cache_key = this.cacheKeyFor(pathname, options);

  if (this.__assets__[logical_cache_key]) {
    return this.__assets__[logical_cache_key];
  }

  asset = _findAsset.call(this, pathname, options);

  if (asset) {
    fullpath_cache_key = this.cacheKeyFor(asset.pathname, options);

    // Cache on Index
    this.__assets__[logical_cache_key]  =
    this.__assets__[fullpath_cache_key] = asset;

    // Push cache upstream to Environment
    this.environment.__assets__[logical_cache_key]  =
    this.environment.__assets__[fullpath_cache_key] = asset;

    return asset;
  }
};


var _buildAsset = Base.prototype.buildAsset;


// See Base#buildAsset
Index.prototype.buildAsset = function (logicalPath, pathname, options) {
  var self = this, key = this.cacheKeyFor(pathname, options);

  if (!this.__assets__[key]) {
    this.__assets__[key] = this.cacheAsset(key, function () {
      return _buildAsset.call(self, logicalPath, pathname, options);
    });
  }

  return this.__assets__[key];
};


/** internal
 *  Index#expireIndex() -> Void
 *
 *  Throws an error. Kept for keeping same interface as in [[Environment]].
 **/
Index.prototype.expireIndex = function () {
  throw new Error('Can not modify immutable index');
};
