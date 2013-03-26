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
};


require('util').inherits(SassEngine, Template);


// Check whenever node-sass module is loaded
SassEngine.prototype.isInitialized = function () {
  return !!sass;
};


// Autoload node-sass library
SassEngine.prototype.initializeEngine = function () {
  sass = this.require('node-sass');
};


// Render data
SassEngine.prototype.evaluate = function (context, locals, callback) {
  /*jshint unused:false*/
  sass.render(this.data, callback,{
    'includePaths':[path.dirname(this.file)].concat(context.environment.paths)
  });
};


// Expose default MimeType of an engine
prop(SassEngine, 'defaultMimeType', 'text/css');
