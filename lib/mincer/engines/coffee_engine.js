/** internal
 *  class CoffeeEngine
 *
 *  Subclass of [[Template]].
 *
 *  Engine for the CoffeeScript compiler. You will need `coffee-script` Node
 *  module installed in order to use [[Mincer]] with `*.coffee` files:
 *
 *      npm install coffee-script
 **/


'use strict';


// 3rd-party
var coffee; // initialized later


// internal
var Template  = require('../template');
var prop      = require('../common').prop;


////////////////////////////////////////////////////////////////////////////////


// Class constructor
var CoffeeEngine = module.exports = function CoffeeEngine() {
  Template.apply(this, arguments);
};


require('util').inherits(CoffeeEngine, Template);


// Check whenever coffee-script module is loaded
CoffeeEngine.prototype.isInitialized = function () {
  return !!coffee;
};


// Autoload coffee-script library
CoffeeEngine.prototype.initializeEngine = function () {
  coffee = this.requireTemplateLibrary('coffee-script');
};


// Render data
CoffeeEngine.prototype.evaluate = function (context, locals, callback) {
  try {
    var result = coffee.compile(this.data, {bare: true});
    callback(null, result);
  } catch (err) {
    callback(err);
  }
};


// Expose default MimeType of an engine
prop(CoffeeEngine, 'defaultMimeType', 'application/javascript');
