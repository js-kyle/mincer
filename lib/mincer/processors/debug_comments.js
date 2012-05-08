'use strict';


// internal
var Template = require('../template');


var DebugComments = module.exports = function DebugComments() {
  Template.apply(this, arguments);
};


require('util').inherits(DebugComments, Template);


DebugComments.prototype.prepare = function () {};


DebugComments.prototype.evaluate = function (context, locals, fn) {
  this.data = '\n\n/** ' + context.pathname + ' **/\n\n' + this.data;
  fn(null, this.data);
};
