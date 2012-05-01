'use strict';


// internal
var prop  = require('../common').prop;
var Asset = require('./asset');


var BundledAsset = module.exports = function BundledAsset() {
  Asset.apply(this, arguments);
};


require('util').inherits(BundledAsset, Asset);


Asset.prototype.getSource = function (callback) {
  callback();
};
