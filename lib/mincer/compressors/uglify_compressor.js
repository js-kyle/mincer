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
var _ = require('lodash');
var UglifyJS; // initialized later


// internal
var Template = require('../template');
var prop     = require('../common').prop;


////////////////////////////////////////////////////////////////////////////////


// Class constructor
var UglifyCompressor = module.exports = function UglifyCompressor() {
  Template.apply(this, arguments);
  UglifyJS = UglifyJS || Template.libs['uglify-js'] || require('uglify-js');

  // Ensure UglifyJS v2 API
  if (!!UglifyJS.parser) {
    throw new Error('UglifyJS v1 not supported, please upgrade library.');
  }
};


require('util').inherits(UglifyCompressor, Template);


// Internal (private) options storage
var options = {};


/**
 *  UglifyCompressor.configure(opts) -> Void
 *  - opts (Object):
 *
 *  Allows to set UglifyJS options.
 *  See UglifyJS minify options for details.
 *
 *  Default: `{}`.
 *
 *
 *  ##### Example
 *
 *      UglifyCompressor.configure({mangle: false});
 **/
UglifyCompressor.configure = function (opts) {
  options = _.clone(opts);
};


// Compress data
UglifyCompressor.prototype.evaluate = function (context/*, locals*/) {

  // Built-in 'UglifyJS.minify' miss sources from input sourcemap
  // (it expect src only from minified files)
  // We create custom source_map object, and push src files manually
  var orig_map = JSON.parse(context.sourceMap);
  var source_map = UglifyJS.SourceMap({
    file: context.__logicalPath__,
    orig: orig_map,
    //root: context.environment.root
  });
  orig_map.sources.forEach(function(src, idx) {
    source_map.get().setSourceContent(src, orig_map.sourcesContent[idx]);
  });

  var result = UglifyJS.minify(this.data, _.merge(options, {
    fromString:   true,
    output : { source_map: source_map }
  }));

  context.sourceMap = result.map + '';
  return result.code;
};


// Expose default MimeType of an engine
prop(UglifyCompressor, 'defaultMimeType', 'application/javascript');
