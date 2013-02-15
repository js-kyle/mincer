/*jshint boss:true */

/**
 *  class EcoEngine
 *
 *  Engine for the ECO compiler. You will need `eco` Node module installed
 *  in order to use [[Mincer]] with `*.eco` files:
 *
 *      npm install eco
 *
 *
 *  ##### SUBCLASS OF
 *
 *  [[Template]]
 **/

'use strict';

// 3rd-party
var eco; // initialized later
var _ = require('underscore');

// internal
var prop     = require('../common').prop;
var Template = require('../template');

// Class constructor
var EcoEngine = module.exports = function EcoEngine() {
  Template.apply(this, arguments);
};

require('util').inherits(EcoEngine, Template);

// Check whenever eco module is loaded
EcoEngine.prototype.isInitialized = function () {
  return !!eco;
};

// Autoload eco library
EcoEngine.prototype.initializeEngine = function () {
  eco = this.require('eco');
};

// Lazy evaluation
EcoEngine.prototype.toString = function () {
  var source, lazy;
  if ((lazy = this.lazy) && (source = lazy.source) && _.isFunction(source)) {
    return source(lazy.context);
  }
  throw new Error("EcoEngine does not seem to be evaluated yet");
};

// Render data
EcoEngine.prototype.evaluate = function (context, locals, callback) {
  try {
    this.lazy = { source:  eco.compile(this.data.trimRight()),
                  context: _.extend(_.clone(context), locals) };
    prop(this, 'lazySource', this.lazy.source);
    callback(null, this);
  } catch (err) {
    callback(err);
  }
};
