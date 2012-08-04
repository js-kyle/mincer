/**
 *  class HamlCoffeeEngine
 *
 *  Engine for the Haml Coffee Templat compiler. You will need `haml-coffee`
 *  Node module installed in order to use [[Mincer]] with `*.hamlc` files:
 *
 *      npm install haml-coffee
 *
 *
 *  ##### SUBCLASS OF
 *
 *  [[Template]]
 **/


'use strict';


// 3rd-party
var hamlc; // initialized later


// internal
var Template  = require('../template');
var prop      = require('../common').prop;


////////////////////////////////////////////////////////////////////////////////


// Class constructor
var HamlCoffeeEngine = module.exports = function HamlCoffeeEngine() {
  Template.apply(this, arguments);
};


require('util').inherits(HamlCoffeeEngine, Template);


// Check whenever coffee-script module is loaded
HamlCoffeeEngine.prototype.isInitialized = function () {
  return !!hamlc;
};


// Autoload coffee-script library
HamlCoffeeEngine.prototype.initializeEngine = function () {
  hamlc = this.require('haml-coffee');
};


// Render data
HamlCoffeeEngine.prototype.evaluate = function (context, locals, callback) {
  try {
    var result = hamlc.template(this.data, context.logicalPath);
    callback(null, result);
  } catch (err) {
    callback(err);
  }
};


// Expose default MimeType of an engine
prop(HamlCoffeeEngine, 'defaultMimeType', 'application/javascript');
