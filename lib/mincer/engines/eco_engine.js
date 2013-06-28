/**
 *  class EcoEngine
 *
 *  Engine for the ECO compiler. You will need `eco` Node module installed
 *  in order to use [[Mincer]] with `*.eco` files:
 *
 *      npm install eco
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
  eco = eco || Template.libs["eco"] || require("eco");
};


require('util').inherits(EcoEngine, Template);


// Render data
EcoEngine.prototype.evaluate = function (/*context, locals*/) {
  return eco.compile(this.data.trimRight());
};
