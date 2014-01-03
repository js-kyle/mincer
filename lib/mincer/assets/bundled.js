/** internal
 *  class BundledAsset
 *
 *  `BundledAsset`s are used for files that need to be processed and
 *  concatenated with other assets, e.g. .js` and `.css` files.
 *
 *
 *  ##### SUBCLASS OF
 *
 *  [[Asset]]
 **/


'use strict';


// 3rd-party
var _ = require('lodash');


// internal
var prop    = require('../common').prop;
var getter  = require('../common').getter;
var Asset   = require('./asset');


////////////////////////////////////////////////////////////////////////////////


/**
 *  new BundledAsset()
 *
 *  See [[Asset.new]] for details.
 **/
var BundledAsset = module.exports = function BundledAsset() {
  var processedAsset, Klass, context, processors, options, source = '';

  Asset.apply(this, arguments);
  prop(this, 'type', 'bundled');

  processedAsset = this.environment.findAsset(this.pathname, { bundle: false });

  prop(this, '__processedAsset__',  processedAsset);
  prop(this, '__requiredAssets__',  processedAsset.__requiredAssets__);
  prop(this, '__dependencyPaths__', processedAsset.__dependencyPaths__);

  this.toArray().forEach(function (dep) {
    source += dep.toString();
  });

  // prepare to build ourself
  Klass       = this.environment.ContextClass;
  context     = new Klass(this.environment, this.logicalPath, this.pathname);
  processors  = this.environment.getBundleProcessors(this.contentType);
  options     = { data: source, processors: processors };

  this.__source__ = context.evaluate(this.pathname, options);

  this.mtime  = _.chain(this.toArray().concat(this.__dependencyPaths__))
    .map(function (asset) { return new Date(Date.parse(asset.mtime)); })
    .max()
    .value();

  this.length = Buffer.byteLength(this.source);
  this.digest = this.environment.digest.update(this.source).digest('hex');
};


require('util').inherits(BundledAsset, Asset);


// See apidoc of [[Asset#buffer]]
getter(BundledAsset.prototype, 'buffer', function () {
  return this.__buffer__ || new Buffer(this.source);
});


// See apidoc of [[Asset#source]]
getter(BundledAsset.prototype, 'source', function () {
  return this.__source__;
});


/**
 *  BundledAsset#dependencies -> Array
 *
 *  Return an `Array` of `Asset` files that are declared dependencies.
 **/
getter(BundledAsset.prototype, 'dependencies', function () {
  return _.reject(this.toArray(), function (asset) {
    return this.__processedAsset__ === asset;
  }, this);
});


/**
 *  BundledAsset#toArray() -> Array
 *
 *  Return array of porcessed assets this asset contains of.
 **/
BundledAsset.prototype.toArray = function () {
  return this.__requiredAssets__;
};


/**
 *  BundledAsset#isFresh(environment) -> Boolean
 *  - environment (Environment|Index)
 *
 *  Checks if Asset is stale by comparing the actual mtime and
 *  digest to the inmemory model.
 **/
BundledAsset.prototype.isFresh = function (environment) {
  return this.__processedAsset__.isFresh(environment);
};


BundledAsset.prototype.encodeWith = function (hash) {
  Asset.prototype.encodeWith.call(this, hash);

  hash.source                = this.__source__;
  hash.requiredAssetsDigest  = this.__processedAsset__.dependencyDigest;
};


BundledAsset.prototype.initWith = function (environment, hash) {
  Asset.prototype.initWith.call(this, environment, hash);

  this.__source__ = hash.source;

  prop(this, '__processedAsset__',  environment.findAsset(this.pathname, { bundle: false }));
  prop(this, '__requiredAssets__',  this.__processedAsset__.__requiredAssets__);

  if (this.__processedAsset__.dependencyDigest !== hash.requiredAssetsDigest) {
    throw {
      code:     'unserialize_error',
      message:  'processed asset belongs to a stale environment'
    };
  }
};
