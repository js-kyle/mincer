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
var _         = require('lodash');
var sourcemap = require('source-map');
var path      = require('path');


// internal
var prop    = require('../common').prop;
var getter  = require('../common').getter;
var Asset   = require('./asset');

function mapify(path) {
  return path.sep === '\\' ? path.replace('\\', '/') : path;
}

function shiftPaths(map, relativePath) {
  map.sources.forEach(function (file, idx) {
    map.sources[idx] = mapify(path.normalize(path.join(relativePath, file)));
  });
}

////////////////////////////////////////////////////////////////////////////////


/**
 *  new BundledAsset()
 *
 *  See [[Asset.new]] for details.
 **/
var BundledAsset = module.exports = function BundledAsset() {
  var processedAsset, Klass, context, processors, options, result,
      source = '', sourceMap = '', resultSourceNode;

  Asset.apply(this, arguments);
  prop(this, 'type', 'bundled');

  processedAsset = this.environment.findAsset(this.pathname, { bundle: false });

  prop(this, '__processedAsset__',  processedAsset);
  prop(this, '__requiredAssets__',  processedAsset.__requiredAssets__);
  prop(this, '__dependencyPaths__', processedAsset.__dependencyPaths__);

  // moved from the end just to use context helper function
  Klass       = this.environment.ContextClass;
  context     = new Klass(this.environment, this.logicalPath, this.pathname);


  if (!this.environment.isEnabled('source_maps')) {
    this.toArray().forEach(function (dep) {
      source += dep.toString();
    });
  } else {

    var baseDir = path.dirname(this.pathname);
    resultSourceNode = new sourcemap.SourceNode(
                              null,
                              null,
                              path.basename(this.pathname)
                            );

    this.toArray().forEach(function (dep) {
      var map = context.createSourceMapObject({
        data: dep.toString(),
        map:  dep.sourceMap,
        file: dep.pathname
      });

      // Convert dependency paths to be relative to current dir
      shiftPaths(map, path.relative(baseDir, path.dirname(dep.pathname)));

      var depSourceNone = sourcemap.SourceNode.fromStringWithSourceMap(
                            dep.toString(),
                            new sourcemap.SourceMapConsumer(map)
                          );
      resultSourceNode.add(depSourceNone);
    });

    result = resultSourceNode.toStringWithSourceMap();
    sourceMap = result.map.toString();
    source = result.code;
  }

  // prepare to build ourself
  processors  = this.environment.getBundleProcessors(this.contentType);
  options     = { data: source, map: sourceMap, processors: processors };

  result          = context.evaluate(this.pathname, options);
  this.__source__ = result.data;

  this.sourceMap = '';

  if (result.map) {
    // Here we have final map. Need to shift paths again,
    // because all bundled assets are placed to env root
    sourceMap = JSON.parse(result.map);
    shiftPaths(sourceMap, path.dirname(path.relative(this.environment.root, this.pathname)));
    // Set default root to avoid shifting. This var is easy to manipulate later.
    sourceMap.sourceRoot = this.environment.sourceRoot;
    this.sourceMap  = JSON.stringify(sourceMap);
  }

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
  hash.sourceMap             = this.sourceMap;
  hash.requiredAssetsDigest  = this.__processedAsset__.dependencyDigest;
};


BundledAsset.prototype.initWith = function (environment, hash) {
  Asset.prototype.initWith.call(this, environment, hash);

  this.__source__ = hash.source;
  this.sourceMap  = hash.sourceMap;

  prop(this, '__processedAsset__',  environment.findAsset(this.pathname, { bundle: false }));
  prop(this, '__requiredAssets__',  this.__processedAsset__.__requiredAssets__);

  if (this.__processedAsset__.dependencyDigest !== hash.requiredAssetsDigest) {
    throw {
      code:     'unserialize_error',
      message:  'processed asset belongs to a stale environment'
    };
  }
};


BundledAsset.prototype.mappingUrlComment = function () {
  if (this.contentType === 'text/css') {
    return '\n/*# sourceMappingURL=' + path.basename(this.digestPath) + '.map' + ' */';
  }
  if (this.contentType === 'application/javascript') {
    return '\n//# sourceMappingURL=' + path.basename(this.digestPath) + '.map';
  }
  return '';
};
