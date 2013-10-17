/**
 *  class UglifyCompressor
 *
 *  Engine for CSS minification. You will need `uglify-js` Node module installed:
 *
 *      npm install uglify-js
 *
 *
 *  ##### SUBCLASS OF
 *
 *  [[Template]]
 **/


'use strict';


// 3rd-party
var UglifyJS; // initialized later


// internal
var Template = require('../template');
var prop     = require('../common').prop;


////////////////////////////////////////////////////////////////////////////////


// Class constructor
var UglifyCompressor = module.exports = function UglifyCompressor() {
  Template.apply(this, arguments);
  UglifyJS = UglifyJS || Template.libs["uglify-js"] || require("uglify-js");

  // Ensure UglifyJS v2 API
  if (!!UglifyJS.parser) {
    throw new Error("UglifyJS v1 not supported, please upgrade library.");
  }
};


require('util').inherits(UglifyCompressor, Template);


// Compress data
UglifyCompressor.prototype.evaluate = function (/*context, locals*/) {
  return UglifyJS.minify(this.data, { fromString: true, compress: false }).code;
};


// Expose default MimeType of an engine
prop(UglifyCompressor, 'defaultMimeType', 'application/javascript');
