/**
 *  class Template
 **/


'use strict';


// stdlib
var fs = require('fs');


// internal
var prop = require('./common').prop;


var EngineTemplate = module.exports = function EngineTemplate(file, line, options, fn) {
  var self = this, reader;

  reader = (fn || function () { return fs.readFileSync(file, 'utf8'); });

  prop(this, 'data', reader(file), {writable: true});
  prop(this, 'file', file);

  this.prepare();
};


EngineTemplate.prototype.prepare = function () {
  throw new Error("Not implemented");
};


EngineTemplate.prototype.evaluate = function (context, locals, fn) {
  throw new Error("Not implemented");
};


EngineTemplate.prototype.requireTemplateLibrary = function (name) {
  return require(name);
};
