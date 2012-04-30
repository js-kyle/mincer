'use strict';


// internal
var prop  = require('./common').prop;
var Asset = require('./asset');


var StaticAsset = module.exports = function StaticAsset() {
  Asset.apply(this, arguments);
};


require('util').inherits(StaticAsset, Asset);
