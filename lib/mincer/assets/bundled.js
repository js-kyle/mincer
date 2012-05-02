'use strict';


// 3rd-party
var async = require('async');


// internal
var prop  = require('../common').prop;
var Asset = require('./asset');


var BundledAsset = module.exports = function BundledAsset() {
  Asset.apply(this, arguments);
};


require('util').inherits(BundledAsset, Asset);


BundledAsset.prototype.getSource = function (callback) {
  var self = this;
  var Klass = this.environment.ContextClass;
  var processed_asset = this.environment.findAsset(this.pathname, {bundle: false});
  var context = new (Klass)(self.environment, self.logical_path, self.pathname);

  processed_asset.getSource(function (err, source) {
    async.forEachSeries(processed_asset.required_assets, function (asset, next) {
      asset.getSource(function (err, data) {
        source += data;
        next(err);
      });
    }, function (err) {
      context.evaluate(self.pathname, {
        data: source,
        processors: self.environment.getBundleProcessors(self.content_type)
      }, callback);
    });
  });
};
