/**
 *  class StylusEngine
 *
 *  Engine for the Stylus compiler. Uses `stylus` Node module.
 **/


'use strict';


// stdlib
var path = require('path');


// 3rd-party
var _ = require('underscore');
var stylus; // initialized later


// internal
var EngineTemplate = require('../engine_template');
var getter         = require('../common').getter;


var StylusEngine = module.exports = function StylusEngine() {
  EngineTemplate.apply(this, arguments);
};


require('util').inherits(StylusEngine, EngineTemplate);


StylusEngine.prototype.prepare = function () {};


// Check whenever Stylus is loaded
getter(StylusEngine.prototype, 'isInitialized', function () {
  return !!stylus;
});


// Autoload stylus library. If the library isn't loaded
StylusEngine.prototype.initialize = function () {
  stylus = this.requireTemplateLibrary('stylus');
};


StylusEngine.prototype.evaluate = function (context, locals, callback) {
  stylus(this.data, {}).render(callback);
};
