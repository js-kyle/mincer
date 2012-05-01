'use strict';


// internal
var prop  = require('../common').prop;
var Asset = require('./asset');


var BundledAsset = module.exports = function BundledAsset() {
  Asset.apply(this, arguments);
};


require('util').inherits(BundledAsset, Asset);


Asset.prototype.getSource = function (callback) {
  var Klass = this.environment.Context, context;

  context = new (Klass)(this.environment, this.logical_path, this.pathname);

  context.evaluate(this.pathname, {
    data: "",
    processors: this.environment.bundleProcessors(this.content_type)
  }, callback);
};
