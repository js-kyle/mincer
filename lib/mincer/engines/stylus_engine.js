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
var Template  = require('../template');
var prop      = require('../common').prop;
var getter    = require('../common').getter;


var StylusEngine = module.exports = function StylusEngine() {
  Template.apply(this, arguments);
};


require('util').inherits(StylusEngine, Template);


StylusEngine.prototype.prepare = function () {};


// Check whenever Stylus is loaded
StylusEngine.prototype.isInitialized = function () {
  return !!stylus;
};


// Autoload stylus library. If the library isn't loaded
StylusEngine.prototype.initializeEngine = function () {
  stylus = this.requireTemplateLibrary('stylus');
};


prop(StylusEngine, '__configurators__', [], {writable: true});


StylusEngine.registerConfigurator = function (fn) {
  this.__configurators__.push(fn);
};


StylusEngine.clearConfigurators = function () {
  this.__configurators__ = [];
};


getter(StylusEngine, 'configurators', function () {
  return this.__configurators__.slice();
});


StylusEngine.prototype.evaluate = function (context, locals, callback) {
  var style = stylus(this.data, {
    paths:    [path.dirname(this.file)].concat(context.environment.paths),
    filename: this.file
  });

  _.each(locals, function (func, name) {
    // Stylus determine how much arguments to pass on helper function's length
    // So we keep amount of arguments reasonable big...
    style.define(name, function (a, b, c, d, e, f, g, h) {
      var o = {};

      ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].forEach(function (k, i) {
        o[k] = (this[i] || {}).val;
      }, arguments);

      return func(o.a, o.b, o.c, o.d, o.e, o.f, o.g, o.h);
    });
  });

  _.each(StylusEngine.configurators, function (fn) {
    fn(style);
  });

  style.render(callback);
};


prop(StylusEngine, 'defaultMimeType', 'text/css');
