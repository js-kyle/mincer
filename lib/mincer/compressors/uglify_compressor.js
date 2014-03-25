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
var _    = require('lodash');
var path = require('path');
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
  var opts = _.merge(options, { fromString: true }),
      result, origSourceMap, sourceMap;

  if (!context.environment.isEnabled('source_maps')) {
    this.data = UglifyJS.minify(this.data, opts).code;
    return;
  }

  // Built-in 'UglifyJS.minify' miss sources from input sourcemap
  // (it expect src only from minified files)
  // We create custom source_map object, and push src files manually
  origSourceMap = context.createSourceMapObject(this);

  sourceMap     = UglifyJS.SourceMap({
    file: path.basename(context.pathname),
    orig: origSourceMap
  });

  origSourceMap.sources.forEach(function(src, idx) {
    sourceMap.get().setSourceContent(src, origSourceMap.sourcesContent[idx]);
  });

  _.extend(opts, { output: { source_map: sourceMap } });
  result = UglifyJS.minify(this.data, opts);

  this.map  = result.map;
  this.data = result.code;
};


// Expose default MimeType of an engine
prop(UglifyCompressor, 'defaultMimeType', 'application/javascript');
