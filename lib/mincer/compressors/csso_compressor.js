/**
 *  class CssoCompressor
 *
 *  Engine for CSS minification. You will need `csso` Node module installed:
 *
 *      npm install csso
 *
 *
 *  ##### SUBCLASS OF
 *
 *  [[Template]]
 **/


'use strict';


// 3rd-party
var csso; // initialized later


// internal
var Template = require('../template');
var prop     = require('../common').prop;


////////////////////////////////////////////////////////////////////////////////


// Class constructor
var CssoCompressor = module.exports = function CssoCompressor() {
  Template.apply(this, arguments);
  csso = csso || Template.libs.csso || require('csso');
};


require('util').inherits(CssoCompressor, Template);


// Compress data
CssoCompressor.prototype.evaluate = function (/*context, locals*/) {
  this.data = csso.justDoIt(this.data);
};


// Expose default MimeType of an engine
prop(CssoCompressor, 'defaultMimeType', 'text/css');
