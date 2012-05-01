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

  this.constructor.func(context, this.data, callback);
};


/**
 *  Processor.create(name, func) -> Function
 *
 *  Returns new `Processor` subclass.
 **/
Processor.create = function (name, func) {
  var Klass;

  if (!_.isFunction(func)) {
    throw new Error("Processor#create() expects second argument to be a function");
  }

  Klass = function () { Processor.apply(this, arguments); };
  inherits(Klass, Processor);

  prop(Klass, 'name', 'Processor:' + name);
  prop(Klass, 'func', func);

  return Klass;
};
