/**
 *  class PugEngine
 *
 *  Engine for the Pug template language. You will need `pug` Node modules
 *  installed in order to use [[Mincer]] with `*.pug` files:
 *
 *     npm install pug
 *
 *  This is a mixed-type engine that can be used as a 'backend' of [[JstEngine]]
 *  as well as standalone 'middleware' processor in a pipeline.
 *
 *  **NOTICE** Generated functions require you to have `pug` client runtime to
 *  be required:
 *
 *  ``` javascript
 *  //= require pug-runtime
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
var Pug;   // initialized later


// internal
var Template = require('../template');


////////////////////////////////////////////////////////////////////////////////


// Class constructor
var PugEngine = module.exports = function PugEngine() {
  Template.apply(this, arguments);
  Pug = Pug || Template.libs.pug || require('pug');
};


require('util').inherits(PugEngine, Template);


// Internal (private) options storage
var options = {};


/**
 *  PugEngine.configure(opts) -> Void
 *  - opts (Object):
 *
 *  Allows to set Pug compilation opts.
 *  See Pug compilation opts for details.
 *
 *  Default: `{}`.
 *
 *
 *  ##### Example
 *
 *      PugEngine.configure({self: true});
 **/
PugEngine.configure = function (opts) {
  options = _.clone(opts);
};


// Render data
PugEngine.prototype.evaluate = function (context, locals) {
  if (this.nextProcessor && this.nextProcessor.name === 'JstEngine') {
    this.data = Pug.compile(this.data, _.assign({}, options, {
      filename: context.pathname
    })).toString();
    return;
  }

  this.data = Pug.render(this.data, _.assign({}, options, locals, {
    filename: context.pathname
  }));
};
