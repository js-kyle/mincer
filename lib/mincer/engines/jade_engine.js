/**
 *  class JadeEngine
 *
 *  Engine for the Jade template language. You will need `jade` Node modules
 *  installed in order to use [[Mincer]] with `*.jade` files:
 *
 *     npm install jade
 *
 *  This is a "backend" engine of [[JstEngine]].
 *
 *  **NOTICE** Generated functions require you to have `jade` client runtime to
 *  be required:
 *
 *  ``` javascript
 *  //= require jade-runtime
 *  //= require templates/hello
 *  ```
 *
 *
 *  ##### SUBCLASS OF
 *
 *  [[Template]]
 **/


'use strict';


// 3rd-party
var _ = require('underscore');


// internal
var Template  = require('../template');
var prop      = require('../common').prop;


////////////////////////////////////////////////////////////////////////////////


// Class constructor
var JadeEngine = module.exports = exports = function JadeEngine() {
  Template.apply(this, arguments);
};

/*
 * Expose engine
 */
exports._engine = null; // initialized later


require('util').inherits(JadeEngine, Template);


// Check whenever jade module is loaded
JadeEngine.prototype.isInitialized = function () {
  return !!exports._engine;
};


// Autoload jade library
JadeEngine.prototype.initializeEngine = function () {
  exports._engine = this.require('jade');
};


// Internal (private) options storage
var options = {};


/**
 *  JadeEngine.setOptions(value) -> Void
 *  - value (Object):
 *
 *  Allows to set Jade compilation options.
 *  See Jade compilation options for details.
 *
 *  Default: `{}`.
 *
 *
 *  ##### Example
 *
 *      JadeEngine.setOptions({self: true});
 **/
JadeEngine.setOptions = function (value) {
  options = _.clone(value);
};


// Render data
JadeEngine.prototype.evaluate = function (context, locals, callback) {
  try {
    var result = exports._engine.compile(this.data, _.extend({}, options, {
      client:   true,
      filename: context.pathname
    }));

    callback(null, result.toString());
  } catch (err) {
    callback(err);
  }
};
