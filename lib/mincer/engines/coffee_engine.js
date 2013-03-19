/**
 *  class CoffeeEngine
 *
 *  Engine for the CoffeeScript compiler. You will need `coffee-script` Node
 *  module installed in order to use [[Mincer]] with `*.coffee` and
 *  `*.litcoffee` files:
 *
 *      npm install coffee-script
 *
 *
 *  ##### SUBCLASS OF
 *
 *  [[Template]]
 **/


'use strict';


// stdlib
var extname = require("path").extname;


// 3rd-party
var _ = require('underscore');
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
  coffee = this.require('coffee-script');
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
  /*jshint unused:false*/
  try {
    var result, compilerOptions;

    compilerOptions = _.extend({}, options, {
      literate: '.litcoffee' === extname(this.file)
    });

    result = coffee.compile(this.data, compilerOptions);

    callback(null, result);
  } catch (err) {
    callback(err);
  }
};


// Expose default MimeType of an engine
prop(CoffeeEngine, 'defaultMimeType', 'application/javascript');
