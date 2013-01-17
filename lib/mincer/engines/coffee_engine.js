/**
 *  class CoffeeEngine
 *
 *  Engine for the CoffeeScript compiler. You will need `coffee-script` Node
 *  module installed in order to use [[Mincer]] with `*.coffee` files:
 *
 *      npm install coffee-script
 *
 *
 *  ##### SUBCLASS OF
 *
 *  [[Template]]
 **/


'use strict';


// 3rd-party
var _ = require('underscore');


// internal
var Template  = require('../template');
var prop      = require('../common').prop;


////////////////////////////////////////////////////////////////////////////////


// Class constructor
var CoffeeEngine = module.exports = exports = function CoffeeEngine() {
  Template.apply(this, arguments);
};

/*
 * Expose engine
 */
exports._engine = null; // initialized later


require('util').inherits(CoffeeEngine, Template);


// Check whenever coffee-script module is loaded
CoffeeEngine.prototype.isInitialized = function () {
  return !!exports._engine;
};


// Autoload coffee-script library
CoffeeEngine.prototype.initializeEngine = function () {
  exports._engine = this.require('coffee-script');
};


// Internal (private) options storage
var options = {bare: true};


/**
 *  CoffeeEngine.setOptions(value) -> Void
 *  - value (Object):
 *
 *  Allows to set CoffeeScript compilation options.
 *  Default: `{bare: true}`.
 *
 *  ##### Example
 *
 *      CoffeeScript.setOptions({bare: true});
 **/
CoffeeEngine.setOptions = function (value) {
  options = _.clone(value);
};


// Render data
CoffeeEngine.prototype.evaluate = function (context, locals, callback) {
  try {
    var result = exports._engine.compile(this.data, _.clone(options));
    callback(null, result);
  } catch (err) {
    callback(err);
  }
};


// Expose default MimeType of an engine
prop(CoffeeEngine, 'defaultMimeType', 'application/javascript');
