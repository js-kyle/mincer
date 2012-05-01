/** internal
 *  class Processor
 **/


'use strict';


// stdlib
var inherits = require('util').inherits;


// 3rd-party
var _ = require('underscore');


// internal
var Template = require('./template');
var prop     = require('./common').prop;
var getter   = require('./common').getter;


var Processor = module.exports = function Processor() {
  Template.apply(this, arguments);
};


inherits(Processor, Template);


Processor.prototype.prepare = function () {};


Processor.prototype.evaluate = function (context, locals, callback) {
  if (Processor === this.constructor) {
    callback(new Error("Processor can't be used directly. Use `Processor.create()`"));
    return;
  }

  this.constructor.processor(context, this.data, callback);
};


Processor.create = function (name, fn) {
  var klass;

  klass = function () { Processor.apply(this, arguments); };
  inherits(klass, Processor);

  prop(klass, 'name',     'Processor:' + name);
  prop(klass, 'processor', fn);

  return klass;
};
