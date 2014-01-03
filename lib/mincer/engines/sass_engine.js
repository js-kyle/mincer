/**
 *  class SassEngine
 *
 *  Engine for the SASS/SCSS compiler. You will need `node-sass` Node module installed
 *  in order to use [[Mincer]] with `*.sass` or `*.scss` files:
 *
 *      npm install node-sass
 *
 *
 *  ##### SUBCLASS OF
 *
 *  [[Template]]
 **/


'use strict';

// stdlib
var path = require('path');

// 3rd-party
var sass; // initialized later


// internal
var Template  = require('../template');
var prop      = require('../common').prop;


////////////////////////////////////////////////////////////////////////////////


// Class constructor
var SassEngine = module.exports = function SassEngine() {
  Template.apply(this, arguments);
  sass = sass || Template.libs['node-sass'] || require('node-sass');

  // Ensure node sass module has renderSync method
  if (!sass.renderSync) {
    throw new Error('node-sass < v0.5 is not supported.');
  }
};


require('util').inherits(SassEngine, Template);


// Render data
SassEngine.prototype.evaluate = function (context/*, locals*/) {
  return sass.renderSync({
    data:         this.data,
    includePaths: [path.dirname(this.file)].concat(context.environment.paths)
  });
};


// Expose default MimeType of an engine
prop(SassEngine, 'defaultMimeType', 'text/css');
