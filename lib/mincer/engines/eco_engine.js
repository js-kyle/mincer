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
var Template = require('../template');

////////////////////////////////////////////////////////////////////////////////

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

// Render data
EcoEngine.prototype.evaluate = function (context, locals, callback) {
  try {
    var fn = eco.compile(this.data.trimRight());

    fn.solve = function () {
      var completeContext = _.extend(_.clone(context), locals);
      return fn(completeContext);
    };

    callback(null, fn);
  } catch (err) {
    callback(err);
  }
};
