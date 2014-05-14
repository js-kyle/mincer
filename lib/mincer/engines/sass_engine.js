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
var _ = require('lodash');
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


// helper to generate human-friendly errors.
// adapted version from less_engine.js
function sassError(ctx /*, options*/) {
  // libsass error string format: path:line: error: message
  var error = _.zipObject(
    ['path', 'line', 'level', 'message'],
    ctx.split(':', 4).map(function(str) { return str.trim(); })
  );
  if(error.line && error.level && error.message) {
    return new Error('Line ' + error.line + ': ' + error.message);
  }

  return new Error(ctx);
}


// Render data
SassEngine.prototype.evaluate = function (context/*, locals*/) {
  try {
    this.data = sass.renderSync({
      data:         this.data,
      includePaths: [path.dirname(this.file)].concat(context.environment.paths)
    });
  } catch(err) {
    var error = sassError(err);
    throw error;
  }
};


// Expose default MimeType of an engine
prop(SassEngine, 'defaultMimeType', 'text/css');
