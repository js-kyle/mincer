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
var _     = require('underscore');
var async = require('async');


// internal
var noop    = require('../common').noop;
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
  Asset.apply(this, arguments);

  prop(this, 'type', 'bundled');
  prop(this, '__processedAsset__',
       this.environment.findAsset(this.pathname, {bundle: false}));
};


require('util').inherits(BundledAsset, Asset);


// See apidoc of [[Asset#compile]]
BundledAsset.prototype.compile = function (callback) {
  var self = this;

  // make sure callback is callable
  callback = callback || noop;

  // do not compile again once asset was compiled
  if (this.isCompiled) {
    callback(null, this);
    return;
  }

  async.series([
    // compile processed asset first
    function (next) {
      self.__processedAsset__.compile(next);
    },

    // process ourselves
    function (next) {
      var Klass, context, processors, options, source = "";

      prop(self, '__requiredAssets__',  self.__processedAsset__.__requiredAssets__);
      prop(self, '__dependencyPaths__', self.__processedAsset__.__dependencyPaths__);

      // gather dependency bodies
      self.toArray().forEach(function (dependency) {
        source += dependency.toString();
      });

      // prepare to build ourself
      Klass       = self.environment.ContextClass;
      context     = new Klass(self.environment, self.logicalPath, self.pathname);
      processors  = self.environment.getBundleProcessors(self.contentType);
      options     = {data: source, processors: processors};

      context.evaluate(self.pathname, options, function (err, source) {
        if (err) {
          next(err);
          return;
        }

        // save rendered string
        prop(self, '__buffer__', new Buffer(source));

        // update some props
        self.mtime  = _.max(self.toArray().concat(self.__dependencyPaths__), function (asset) {
          return Date.parse(asset.mtime);
        }).mtime;

        self.length = Buffer.byteLength(source);
        self.digest = self.environment.digest.update(source).digest('hex');

        next(err);
      });
    }
  ], function (err) {
    if (err) {
      callback(err);
      return;
    }

    callback(null, self);
  });
};


// See apidoc of [[Asset#buffer]]
getter(BundledAsset.prototype, 'buffer', function () {
  this._requireCompilation('buffer');
  return this.__buffer__;
});


// See apidoc of [[Asset#source]]
getter(BundledAsset.prototype, 'source', function () {
  return this.buffer.toString('utf8');
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
  return this.__processedAsset__.isFresh(environment) && this.isCompiled;
};


// See [[Asset#isCompiled]] documentation
getter(BundledAsset.prototype, 'isCompiled', function () {
  return !!this.__buffer__;
});
