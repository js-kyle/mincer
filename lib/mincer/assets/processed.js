'use strict';


// 3rd-party
var _     = require('underscore');
var async = require('async');
var Hash  = require('types').Hash;


// internal
var prop  = require('../common').prop;
var Asset = require('./asset');


var ProcessedAsset = module.exports = function ProcessedAsset() {
  Asset.apply(this, arguments);
};


require('util').inherits(ProcessedAsset, Asset);


ProcessedAsset.prototype.getSource = function (callback) {
  var self        = this,
      Klass       = this.environment.ContextClass,
      start_time  = Date.now(),
      context;

  context = new (Klass)(this.environment, this.logical_path, this.pathname);
  context.evaluate(this.pathname, {}, function (err, source) {
    if (err) {
      callback(err);
      return;
    }

    async.series(
      [
        function (next) { self.buildRequiredAssets(self.environment, context, next); }
        //function (next) { self.buildDependencyPaths(self.environment, context, next); }
      ],
      function (err) { callback(err, source); }
    );
  });
};


ProcessedAsset.prototype.buildRequiredAssets = function (environment, context, callback) {
  var assets, stubs;

  assets = this.resolveDependencies(environment, context.__requiredPaths__.concat(this.pathname));
  stubs  = this.resolveDependencies(environment, context.__stubbedAssets__);

  this.required_assets = _.without(assets, stubs);
  callback();
};


ProcessedAsset.prototype.resolveDependencies = function (environment, paths) {
  var assets = [], cache = new Hash();

  _.each(paths, function (p) {
    var asset = (p === this.pathname) ? this
              : environment.findAsset(p, {bundle: false});

    if (p === this.pathname) {
      if (!cache.hasKey(this)) {
        cache.set(asset, true);
        assets.push(asset);
      }
      return;
    } else if (asset) {
      return;
    }
  }, this);

  return assets;
};
