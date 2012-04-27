/**
 *  class Processor
 **/


'use strict';


// stdlib
var inherits = require('util').inherits;


// 3rd-party
var _ = require('underscore');


// internal
var EngineTemplate = require('../engine_template');
var prop           = require('../common').prop;
var getter         = require('../common').getter;


var Processor = module.exports = function Processor() {
  EngineTemplate.apply(this, arguments);
};


inherits(Processor, EngineTemplate);


Processor.prototype.prepare = function () {};


Processor.prototype.render = function (context, locals, callback) {
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
