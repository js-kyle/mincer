/**
 *  class EjsEngine
 *
 *  Engine for the EJS compiler. Uses `ejs` Node module.
 **/

'use strict';


// 3rd-party
var _ = require('underscore');
var ejs; // initialized later


// internal
var Template = require('../template');
var getter   = require('../common').getter;


var EjsEngine = module.exports = function EjsEngine() {
  Template.apply(this, arguments);
};


require('util').inherits(EjsEngine, Template);


EjsEngine.prototype.prepare = function () {};


// Check whenever EJS is loaded
EjsEngine.prototype.isInitialized = function () {
  return !!ejs;
};


// Autoload ejs library. If the library isn't loaded, 
EjsEngine.prototype.initializeEngine = function () {
  ejs = this.requireTemplateLibrary('ejs');
};


EjsEngine.prototype.evaluate = function (context, locals, cb) {
  try {
    cb(null, ejs.render(this.data, {scope: context, locals: locals}));
  } catch (err) {
    cb(err);
  }
};
