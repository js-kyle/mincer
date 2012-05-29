/**
 *  class StylusEngine
 *
 *  Engine for the Stylus compiler. You will need `stylus` Node module installed
 *  in order to use [[Mincer]] with `*.stylus` files:
 *
 *      npm install stylus
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
var _ = require('underscore');
var stylus; // initialized later


// internal
var Template  = require('../template');
var prop      = require('../common').prop;
var getter    = require('../common').getter;


////////////////////////////////////////////////////////////////////////////////


// Class constructor
var StylusEngine = module.exports = function StylusEngine() {
  Template.apply(this, arguments);
};


require('util').inherits(StylusEngine, Template);


// Check whenever stylus is loaded
StylusEngine.prototype.isInitialized = function () {
  return !!stylus;
};


// Autoload stylus library
StylusEngine.prototype.initializeEngine = function () {
  stylus = this.require('stylus');
};


// Internal (private) stack of registered configurators
var configurators = [];


/**
 *  StylusEngine.registerConfigurator(fn) -> Void
 *  - fn (Function)
 *
 *  Append `function`, that will be running everytime engine will run renderer.
 *
 *      var nib = require('nib');
 *
 *      Stylus.registerConfigurator(function (style) {
 *        style.use(nib());
 *      });
 **/
StylusEngine.registerConfigurator = function (fn) {
  configurators.push(fn);
};


/**
 *  StylusEngine.clearConfigurators() -> Void
 *
 *  Remove all registered configurators.
 **/
StylusEngine.clearConfigurators = function () {
  configurators = [];
};


/**
 *  StylusEngine.configurators -> Array
 *
 *  Copy of registered configurators.
 **/
getter(StylusEngine, 'configurators', function () {
  return configurators.slice();
});


// Render data
StylusEngine.prototype.evaluate = function (context, locals, callback) {
  var style = stylus(this.data, {
    paths:    [path.dirname(this.file)].concat(context.environment.paths),
    filename: this.file
  });

  // define helpers from the list of passed locals
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

  // run registered configurators
  _.each(configurators, function (fn) {
    fn(style);
  });

  style.render(callback);
};


// Expose default MimeType of an engine
prop(StylusEngine, 'defaultMimeType', 'text/css');
