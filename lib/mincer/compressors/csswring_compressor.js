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

  //console.log('================= Before: ', context.sourceMap);

  result = csswring.wring(this.data, {
    mapAnnotation:  false,
    //sourceRoot:     '/',
    map:            context.sourceMap,
    from:           context.relativePath,
    to:             context.relativePath
  });

  // clear `file` property
  //var sm = JSON.parse(result.map);
  //sm.file = null;

  //context.sourceMap = JSON.stringify(sm);//result.map;
  context.sourceMap = result.map;

  //console.log('================== After: ', context.sourceMap);
  //console.log('path used: ', context.relativePath);
  return result.css;
};


// Expose default MimeType of an engine
prop(CsswringCompressor, 'defaultMimeType', 'text/css');
