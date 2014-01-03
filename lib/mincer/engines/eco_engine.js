/**
 *  class EcoEngine
 *
 *  Engine for the ECO compiler. You will need `eco` Node module installed
 *  in order to use [[Mincer]] with `*.eco` files:
 *
 *      npm install eco
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
var eco; // initialized later

// internal
var Template = require('../template');

////////////////////////////////////////////////////////////////////////////////


// Class constructor
var EcoEngine = module.exports = function EcoEngine() {
  Template.apply(this, arguments);
  eco = eco || Template.libs.eco || require('eco');
};


require('util').inherits(EcoEngine, Template);


// Render data
EcoEngine.prototype.evaluate = function (context, locals) {
  var data = this.data.trimRight();

  if (this.nextProcessor && 'JstEngine' === this.nextProcessor.name) {
    return eco.precompile(data);
  }

  return eco.render(data, locals);
};
