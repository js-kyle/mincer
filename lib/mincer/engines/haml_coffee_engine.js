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


// internal
var Template       = require('../template');
var prop           = require('../common').prop;
var coffee_engine  = require('./coffee_engine');


////////////////////////////////////////////////////////////////////////////////


// Class constructor
var HamlCoffeeEngine = module.exports = exports = function HamlCoffeeEngine() {
  Template.apply(this, arguments);
};

/*
 * Expose engine
 */
exports._engine = null; // initialized later

require('util').inherits(HamlCoffeeEngine, Template);


// Check whenever coffee-script module is loaded
HamlCoffeeEngine.prototype.isInitialized = function () {
  return !!coffee_engine._engine && !!exports._engine;
};


// Autoload coffee-script library
HamlCoffeeEngine.prototype.initializeEngine = function () {
  coffee_engine._engine  = this.require('coffee-script');
  exports._engine = this.require('haml-coffee/src/haml-coffee');
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
  var compiler, source;

  try {
    compiler = new exports._engine(_.clone(options));

    compiler.parse(this.data);

    source = '(params) -> (->\n' +
             compiler.precompile().replace(/^(.*)$/mg, '  $1') +
             ').call(params)';

    callback(null, coffee_engine._engine.compile(source, {bare: true}));
  } catch (err) {
    callback(err);
  }
};
