/** internal
 *  class Template
 **/


'use strict';


// stdlib
var fs = require('fs');


// internal
var prop = require('./common').prop;


var Template = module.exports = function Template(file, line, options, fn) {
  var self = this, reader;

  reader = (fn || function () { return fs.readFileSync(file, 'utf8'); });

  prop(this, 'data', reader(file), {writable: true});
  prop(this, 'file', file);

  if (!this.isInitialized()) {
    this.initializeEngine();
  }

  this.prepare();
};


Template.prototype.isInitialized = function () {
  return true;
};


Template.prototype.initializeEngine = function () {
  return;
};


Template.prototype.prepare = function () {
  throw new Error("Not implemented");
};


Template.prototype.evaluate = function (context, locals, fn) {
  throw new Error("Not implemented");
};


Template.prototype.requireTemplateLibrary = function (name) {
  return require(name);
};
