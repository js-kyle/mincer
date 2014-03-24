/**
 *  class JadeEngine
 *
 *  Engine for the Jade template language. You will need `jade` Node modules
 *  installed in order to use [[Mincer]] with `*.jade` files:
 *
 *     npm install jade
 *
 *  This is a mixed-type engine that can be used as a 'backend' of [[JstEngine]]
 *  as well as standalone 'middleware' processor in a pipeline.
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
var _ = require('lodash');
var Jade;   // initialized later


// internal
var Template = require('../template');


////////////////////////////////////////////////////////////////////////////////


// Class constructor
var JadeEngine = module.exports = function JadeEngine() {
  Template.apply(this, arguments);
  Jade = Jade || Template.libs.jade || require('jade');
};


require('util').inherits(JadeEngine, Template);


// Internal (private) options storage
var options = {};


/**
 *  JadeEngine.configure(opts) -> Void
 *  - opts (Object):
 *
 *  Allows to set Jade compilation opts.
 *  See Jade compilation opts for details.
 *
 *  Default: `{}`.
 *
 *
 *  ##### Example
 *
 *      JadeEngine.configure({self: true});
 **/
JadeEngine.configure = function (opts) {
  options = _.clone(opts);
};


// Render data
JadeEngine.prototype.evaluate = function (context, locals) {
  if (this.nextProcessor && 'JstEngine' === this.nextProcessor.name) {
    // Use `compileClient` for Jade v1.0.0+, and `compile` for older versions
    var compile = Jade.compileClient || Jade.compile;

    this.data = compile(this.data, _.extend({}, options, {
      client:   true, // needed only for Jade < v1.0.0
      filename: context.logicalpath
    })).toString();
    return;
  }

  this.data = Jade.render(this.data, _.extend({}, options, locals, {
    filename: context.pathname
  }));
};
