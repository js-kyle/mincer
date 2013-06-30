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
};


require('util').inherits(UglifyCompressor, Template);


UglifyCompressor.prototype.evaluateWithV1 = function () {
  var ast = UglifyJS.parser.parse(this.data);

  ast = UglifyJS.uglify.ast_mangle(ast);
  ast = UglifyJS.uglify.ast_squeeze(ast);

  return UglifyJS.uglify.gen_code(ast);
};


UglifyCompressor.prototype.evaluateWithV2 = function () {
  return UglifyJS.minify(this.data, { fromString: true }).code;
};


// Compress data
UglifyCompressor.prototype.evaluate = function (/*context, locals*/) {
  return this['evaluateWith' + (!!UglifyJS.parser ? 'V1' : 'V2')]();
};


// Expose default MimeType of an engine
prop(UglifyCompressor, 'defaultMimeType', 'application/javascript');
