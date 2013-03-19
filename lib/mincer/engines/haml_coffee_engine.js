/**
 *  class HamlCoffeeEngine
 *
 *  Engine for the Haml Coffee Template compiler. You will need `haml-coffee`
 *  and `coffee-script` Node modules installed in order to use [[Mincer]] with
 *  `*.hamlc` files:
 *
 *     npm install coffee-script haml-coffee
 *
 *  This is a "backend" engine of [[JstEngine]].
 *
 *
 *  ##### SUBCLASS OF
 *
 *  [[Template]]
 **/


'use strict';


// 3rd-party
var _ = require('underscore');
var CoffeeScript; // initialized later
var HamlCoffee;   // initialized later


// internal
var Template  = require('../template');


////////////////////////////////////////////////////////////////////////////////


// Class constructor
var HamlCoffeeEngine = module.exports = function HamlCoffeeEngine() {
  Template.apply(this, arguments);
};


require('util').inherits(HamlCoffeeEngine, Template);


// Check whenever coffee-script module is loaded
HamlCoffeeEngine.prototype.isInitialized = function () {
  return !!CoffeeScript && !!HamlCoffee;
};


// Autoload coffee-script library
HamlCoffeeEngine.prototype.initializeEngine = function () {
  CoffeeScript  = this.require('coffee-script');
  HamlCoffee    = this.require('haml-coffee/src/haml-coffee');
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


// Render data
HamlCoffeeEngine.prototype.evaluate = function (context, locals, callback) {
  /*jshint unused:false*/
  var compiler, source;

  try {
    compiler = new HamlCoffee(_.clone(options));

    compiler.parse(this.data);

    source = '(params) -> (->\n' +
             compiler.precompile().replace(/^(.*)$/mg, '  $1') +
             ').call(params)';

    callback(null, CoffeeScript.compile(source, {bare: true}));
  } catch (err) {
    callback(err);
  }
};
