/**
 *  class CsswringCompressor
 *
 *  Engine for CSS minification. Less powerful than CSSO, but with sourcemaps
 *  support. You will need `csswring` Node module installed:
 *
 *      npm install csswring
 *
 *
 *  ##### SUBCLASS OF
 *
 *  [[Template]]
 **/


'use strict';


// 3rd-party
var path      = require('path');
var csswring; // initialized later


// internal
var Template = require('../template');
var prop     = require('../common').prop;


////////////////////////////////////////////////////////////////////////////////


// Class constructor
var CsswringCompressor = module.exports = function CsswringCompressor() {
  Template.apply(this, arguments);
  csswring = csswring || Template.libs.csswring || require('csswring');
};


require('util').inherits(CsswringCompressor, Template);


// Compress data
CsswringCompressor.prototype.evaluate = function (context/*, locals*/) {
  var result;

  if (!context.environment.isEnabled('source_maps')) {
    return csswring.wring(this.data).css;
  }

  // Reset sourceRoot bebore process - we work with relative paths
  var map = JSON.parse(context.sourceMap);
  var oldRoot = map.sourceRoot;
  map.sourceRoot = '';

  result = csswring.wring(this.data, {
    mapAnnotation:  false,
    map:            map,
    from:           path.basename(context.pathname),
    to:             path.basename(context.pathname)
  });

  // Set back sourceRoot
  map = JSON.parse(result.map);
  map.sourceRoot = oldRoot;

  context.sourceMap = JSON.stringify(map);

  return result.css;
};


// Expose default MimeType of an engine
prop(CsswringCompressor, 'defaultMimeType', 'text/css');
