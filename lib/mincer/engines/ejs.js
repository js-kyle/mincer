/**
 *  class EjsTemplate
 *
 *  Engine for the EJS compiler. Uses `ejs` Node module.
 **/

'use strict';


// 3rd-party
var _ = require('underscore');
var ejs; // initialized later


// internal
var EngineTemplate = require('../engine_template');
var getter         = require('../common').getter;


var EjsTemplate = module.exports = function EjsTemplate() {
  EngineTemplate.apply(this, arguments);
};


require('util').inherits(EjsTemplate, EngineTemplate);


EjsTemplate.prototype.prepare = function () {};


// Check whenever EJS is loaded
getter(EjsTemplate.prototype, 'isInitialized', function () {
  return !!ejs;
});


// Autoload ejs library. If the library isn't loaded, 
EjsTemplate.prototype.initialize = function () {
  ejs = this.requireTemplateLibrary('ejs');
};


EjsTemplate.prototype.evaluate = function (context, locals, cb) {
  try {
    cb(null, ejs.render(this.data, {scope: context, locals: locals}));
  } catch (err) {
    cb(err);
  }
};
