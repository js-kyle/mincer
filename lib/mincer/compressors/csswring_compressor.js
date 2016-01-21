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
var csswring, postcss; // initialized later


// internal
var Template = require('../template');
var prop     = require('../common').prop;


////////////////////////////////////////////////////////////////////////////////


// Class constructor
var CsswringCompressor = module.exports = function CsswringCompressor() {
  Template.apply(this, arguments);
  csswring = csswring || Template.libs.csswring || require('csswring');
  postcss = postcss || Template.libs.postcss || require('postcss');
};


require('util').inherits(CsswringCompressor, Template);


// Compress data
CsswringCompressor.prototype.evaluate = function (context/*, locals*/) {
  var config, result;

  if (!context.environment.isEnabled('source_maps')) {
    config = {
      preserveHacks: true,
      removeAllComments: true
    };
    this.data = postcss([ csswring(config) ]).process(this.data, config).css;
    return;
  }

  // Reset sourceRoot bebore process - we work with relative paths
  var map = context.createSourceMapObject(this);

  config = {
    map: {
      prev:   map,
      inline: false
    },
    from: path.basename(context.pathname),
    to:   path.basename(context.pathname),
    preserveHacks: true,
    removeAllComments: true
  };

  result = postcss([ csswring(config) ]).process(this.data, config);

  this.map  = result.map.toString();
  this.data = result.css;
};


// Expose default MimeType of an engine
prop(CsswringCompressor, 'defaultMimeType', 'text/css');
