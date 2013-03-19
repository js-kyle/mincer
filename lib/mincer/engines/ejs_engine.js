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


// 3rd-party
var ejs; // initialized later


// internal
var Template = require('../template');
var prop     = require('../common').prop;

// Class constructor
var EjsEngine = module.exports = function EjsEngine() {
  Template.apply(this, arguments);
};


require('util').inherits(EjsEngine, Template);


// Check whenever ejs module is loaded
EjsEngine.prototype.isInitialized = function () {
  return !!ejs;
};


// Autoload ejs library
EjsEngine.prototype.initializeEngine = function () {
  ejs = this.require('ejs');
};

// Lazy evaluation
EjsEngine.prototype.toString = function () {
  var options, lazy = this.lazy, source = lazy.source;
  if (lazy && source && source.call) {
    options = lazy.options;
    return source.call(options.scope, options.locals);
  }
  throw new Error("EjsEngine does not seem to be evaluated yet");
};

// Render data
EjsEngine.prototype.evaluate = function (context, locals, callback) {
  /*jshint unused:false*/
  try {
    var lazy = this.lazy = {};
    lazy.options = { scope: context,
                     locals: locals,
                     client: true,
                     filename: context.pathname,
                     compileDebug: false };
    lazy.source  = ejs.compile(this.data.trimRight(), lazy.options);
    prop(this, 'lazySource', lazy.source);
    callback(null, this);
  } catch (err) {
    callback(err);
  }
};
