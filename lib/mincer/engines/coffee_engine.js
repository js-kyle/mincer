/**
 *  class CoffeeEngine
 *
 *  Engine for the Coffee compiler. Uses `coffee` Node module.
 **/


'use strict';


// stdlib
var path = require('path');


// 3rd-party
var coffee; // initialized later


// internal
var Template  = require('../template');
var prop      = require('../common').prop;
var getter    = require('../common').getter;


var CoffeeEngine = module.exports = function CoffeeEngine() {
  Template.apply(this, arguments);
};


require('util').inherits(CoffeeEngine, Template);


CoffeeEngine.prototype.prepare = function () {};


// Check whenever Coffee is loaded
CoffeeEngine.prototype.isInitialized = function () {
  return !!coffee;
};


// Autoload coffee library. If the library isn't loaded
CoffeeEngine.prototype.initializeEngine = function () {
  coffee = this.requireTemplateLibrary('coffee-script');
};


CoffeeEngine.prototype.evaluate = function (context, locals, callback) {
  try {
    var result = coffee.compile(this.data, {bare: true});
    callback(null, result);
  } catch (err) {
    callback(err);
  }
};


prop(CoffeeEngine, 'defaultMimeType', 'application/javascript');
