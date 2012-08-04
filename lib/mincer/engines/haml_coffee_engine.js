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
var _ = require('underscore');
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


// Internal (private) options storage
var options = {};


/**
 *  HamlCoffeeEngine.setOptions(value) -> Void
 *  - value (Object):
 *
 *  Allows to set Haml Coffee Template compilation options.
 *  See Haml Coffee Template compilation options for details.
 *
 *  Default: `{}`.
 *
 *
 *  ##### Example
 *
 *      HamlCoffeeEngine.setOptions({basename: true});
 **/
HamlCoffeeEngine.setOptions = function (value) {
  options = _.clone(value);
};


/**
 *  HamlCoffeeEngine.getOptions() -> Object
 *
 *  Return options object.
 **/
HamlCoffeeEngine.getOptions = function () {
  return _.clone(options);
};


// Internal (private) namespace placeholder
var namespace = 'HAML';


/**
 *  HamlCoffeeEngine.setNamspace(value) -> Void
 *  - value (String):
 *
 *  Allows to set Haml Coffee Template compilation namespace.
 *  Default: `'HAML'`.
 *
 *
 *  ##### Example
 *
 *      HamlCoffeeEngine.setNamspace('HAML_TPL');
 **/
HamlCoffeeEngine.setNamespace = function (value) {
  namespace = value && String(value) || value;
};


/**
 *  HamlCoffeeEngine.getNamespace() -> String
 *
 *  Return compilation namespace.
 **/
HamlCoffeeEngine.getNamespace = function () {
  return namespace;
};


// Render data
HamlCoffeeEngine.prototype.evaluate = function (context, locals, callback) {
  try {
    var result = hamlc.template(this.data, context.logicalPath, namespace,
                                HamlCoffeeEngine.getOptions());
    callback(null, result);
  } catch (err) {
    callback(err);
  }
};


// Expose default MimeType of an engine
prop(HamlCoffeeEngine, 'defaultMimeType', 'application/javascript');
