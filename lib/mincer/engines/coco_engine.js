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
var _ = require('lodash');
var coco; // initialized later


// internal
var Template  = require('../template');
var prop      = require('../common').prop;


////////////////////////////////////////////////////////////////////////////////


// Class constructor
var CocoEngine = module.exports = function CocoEngine() {
  Template.apply(this, arguments);
  coco = coco || Template.libs.coco || require('coco');
};


require('util').inherits(CocoEngine, Template);


// Internal (private) options storage
var options = {bare: true};


/**
 *  CocoEngine.configure(opts) -> Void
 *  - opts (Object):
 *
 *  Allows to set Coco compilation options.
 *  Default: `{bare: true}`.
 *
 *  ##### Example
 *
 *      CocoEngine.configure({bare: true});
 **/
CocoEngine.configure = function (opts) {
  options = _.clone(opts);
};


// Render data
CocoEngine.prototype.evaluate = function (/*context, locals*/) {
  return coco.compile(this.data, _.clone(options));
};


// Expose default MimeType of an engine
prop(CocoEngine, 'defaultMimeType', 'application/javascript');
