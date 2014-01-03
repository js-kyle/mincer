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
var extname = require('path').extname;


// 3rd-party
var _ = require('lodash');
var coffee; // initialized later


// internal
var Template  = require('../template');
var prop      = require('../common').prop;


////////////////////////////////////////////////////////////////////////////////


// Class constructor
var CoffeeEngine = module.exports = function CoffeeEngine() {
  Template.apply(this, arguments);
  coffee = coffee || Template.libs.coffee || require('coffee-script');
};


require('util').inherits(CoffeeEngine, Template);


// Internal (private) options storage
var options = {bare: true};


/**
 *  CoffeeEngine.configure(opts) -> Void
 *  - opts (Object):
 *
 *  Allows to set CoffeeScript compilation options.
 *  Default: `{bare: true}`.
 *
 *  ##### Example
 *
 *      CoffeeScript.configure({bare: true});
 **/
CoffeeEngine.configure = function (opts) {
  options = _.clone(opts);
};


// Render data
CoffeeEngine.prototype.evaluate = function (/*context, locals*/) {
  var loc;

  try {
    return coffee.compile(this.data, _.extend({}, options, {
      literate: '.litcoffee' === extname(this.file)
    }));
  } catch(err) {
    loc = err.location;

    if (loc) {
      loc = 'L' + (loc.first_line + 1) + ':' + (loc.first_column + 1);
      err.message += ' at ' + loc;
    }

    throw err;
  }
};


// Expose default MimeType of an engine
prop(CoffeeEngine, 'defaultMimeType', 'application/javascript');
