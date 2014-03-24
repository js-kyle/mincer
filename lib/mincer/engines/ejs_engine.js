/**
 *  class EjsEngine
 *
 *  Engine for the EJS compiler. You will need `ejs` Node module installed
 *  in order to use [[Mincer]] with `*.ejs` files:
 *
 *      npm install ejs
 *
 *  This is a mixed-type engine that can be used as a 'backend' of [[JstEngine]]
 *  as well as standalone 'middleware' processor in a pipeline.
 *
 *
 *  ##### SUBCLASS OF
 *
 *  [[Template]]
 **/


'use strict';


// 3rd-party
var ejs; // initialized later


// internal
var Template = require('../template');


////////////////////////////////////////////////////////////////////////////////


// Class constructor
var EjsEngine = module.exports = function EjsEngine() {
  Template.apply(this, arguments);
  ejs = ejs || Template.libs.ejs || require('ejs');
};


require('util').inherits(EjsEngine, Template);


// Render data
EjsEngine.prototype.evaluate = function (context, locals) {
  if (this.nextProcessor && 'JstEngine' === this.nextProcessor.name) {
    this.data = ejs.compile(this.data, {
      filename: context.logicalPath,
      client:   true
    }).toString();
    return;
  }

  this.data = ejs.render(this.data, {
    filename: context.pathname,
    scope:    context,
    locals:   locals
  });
};
