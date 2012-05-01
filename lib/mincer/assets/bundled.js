'use strict';


// internal
var prop  = require('../common').prop;
var Asset = require('./asset');


var BundledAsset = module.exports = function BundledAsset() {
  Asset.apply(this, arguments);
};


require('util').inherits(BundledAsset, Asset);


BundledAsset.prototype.getSource = function (callback) {
  var Klass = this.environment.ContextClass, context;

  context = new (Klass)(this.environment, this.logical_path, this.pathname);

  context.evaluate(this.pathname, {
    data: "",
    processors: this.environment.getBundleProcessors(this.content_type)
  }, callback);
};
