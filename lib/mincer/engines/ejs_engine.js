/**
 *  class EjsEngine
 *
 *  Engine for the EJS compiler. You will need `ejs` Node module installed
 *  in order to use [[Mincer]] with `*.ejs` files:
 *
 *      npm install ejs
 *
 *
 *  ##### SUBCLASS OF
 *
 *  [[Template]]
 **/


'use strict';


// internal
var Template = require('../template');


////////////////////////////////////////////////////////////////////////////////


// Class constructor
var EjsEngine = module.exports = exports = function EjsEngine() {
  Template.apply(this, arguments);
};

/*
 * Expose engine
 */
exports._engine = null; // initialized later


require('util').inherits(EjsEngine, Template);


// Check whenever ejs module is loaded
EjsEngine.prototype.isInitialized = function () {
  return !!exports._engine;
};


// Autoload ejs library
EjsEngine.prototype.initializeEngine = function () {
  exports._engine = this.require('ejs');
};


// Render data
EjsEngine.prototype.evaluate = function (context, locals, callback) {
  try {
    callback(null, exports._engine.render(this.data, {scope: context, locals: locals}));
  } catch (err) {
    callback(err);
  }
};
