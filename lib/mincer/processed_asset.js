'use strict';


// internal
var prop  = require('./common').prop;
var Asset = require('./asset');


var ProcessedAsset = module.exports = function ProcessedAsset() {
  Asset.apply(this, arguments);
};


require('util').inherits(ProcessedAsset, Asset);
