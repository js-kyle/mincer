/**
 *  class CocoEngine
 *
 *  Engine for the Coco compiler. You will need `coco` Node
 *  module installed in order to use [[Mincer]] with `*.co` files:
 *
 *      npm install coco
 *
 *
 *  ##### SUBCLASS OF
 *
 *  [[Template]]
 **/


'use strict';

// 3rd-party
var _ = require('underscore');
var coco; // initialized later


// internal
var Template  = require('../template');
var prop      = require('../common').prop;


////////////////////////////////////////////////////////////////////////////////


// Class constructor
var CocoEngine = module.exports = function CocoEngine() {
  Template.apply(this, arguments);
  coco = coco || Template.libs["coco"] || require("coco");
};


require('util').inherits(CocoEngine, Template);


// Internal (private) options storage
var options = {bare: true};


/**
 *  CocoEngine.setOptions(value) -> Void
 *  - value (Object):
 *
 *  Allows to set Coco compilation options.
 *  Default: `{bare: true}`.
 *
 *  ##### Example
 *
 *      CocoEngine.setOptions({bare: true});
 **/
CocoEngine.setOptions = function (value) {
  options = _.clone(value);
};


// Render data
CocoEngine.prototype.evaluate = function (context, locals, callback) {
  /*jshint unused:false*/
  try {
    var result, compilerOptions;

    compilerOptions = _.extend({}, options, {
    });

    result = coco.compile(this.data, compilerOptions);

    callback(null, result);
  } catch (err) {
    callback(err);
  }
};


// Expose default MimeType of an engine
prop(CocoEngine, 'defaultMimeType', 'application/javascript');
