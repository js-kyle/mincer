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


// 3rd-party


// internal
var Template  = require('../template');
var prop      = require('../common').prop;


////////////////////////////////////////////////////////////////////////////////


// Class constructor
var SassEngine = module.exports = exports = function SassEngine() {
  Template.apply(this, arguments);
};

/*
 * Expose engine
 */
exports._engine = null; // initialized later


require('util').inherits(SassEngine, Template);


// Check whenever node-sass module is loaded
SassEngine.prototype.isInitialized = function () {
  return !!exports._engine;
};


// Autoload node-sass library
SassEngine.prototype.initializeEngine = function () {
  exports._engine = this.require('node-sass');
};


// Render data
SassEngine.prototype.evaluate = function (context, locals, callback) {
  exports._engine.render(this.data, callback);
};


// Expose default MimeType of an engine
prop(SassEngine, 'defaultMimeType', 'text/css');
