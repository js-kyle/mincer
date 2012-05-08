'use strict';


// stdlib
var path = require('path');


// internal
var Template = require('../template');


var DebugComments = module.exports = function DebugComments() {
  Template.apply(this, arguments);
};


require('util').inherits(DebugComments, Template);


DebugComments.prototype.prepare = function () {};


DebugComments.prototype.evaluate = function (context, locals, fn) {
  var pathname = path.join(context.rootPath, context.logicalPath);
  this.data = '\n\n/***  ' + pathname + '  ***/\n\n' + this.data;
  fn(null, this.data);
};
