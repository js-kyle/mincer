'use strict';


// internal
var prop  = require('../common').prop;
var Asset = require('./asset');


var ProcessedAsset = module.exports = function ProcessedAsset() {
  Asset.apply(this, arguments);
};


require('util').inherits(ProcessedAsset, Asset);


Asset.prototype.getSource = function (callback) {
  var Klass = this.environment.Context, context;

  context = new (Klass)(this.environment, this.logical_path, this.pathname);
  context.evaluate(this.pathname, {}, callback);
};
