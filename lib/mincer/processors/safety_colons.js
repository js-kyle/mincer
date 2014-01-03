/**
 *  class SafetyColons
 *
 *  For JS developers who are colonfobic, concatenating JS files using
 *  the module pattern usually leads to syntax errors.
 *
 *  The `SafetyColons` processor will insert missing semicolons to the
 *  end of the file.
 *
 *  This behavior can be disabled with:
 *
 *      environment.unregisterPostProcessor('application/javascript', SafetyColons);
 *
 *
 *  ##### SUBCLASS OF
 *
 *  [[Template]]
 **/


'use strict';


// internal
var Template = require('../template');


////////////////////////////////////////////////////////////////////////////////


// Class constructor
var SafetyColons = module.exports = function SafetyColons() {
  Template.apply(this, arguments);
};


require('util').inherits(SafetyColons, Template);



// Process data
SafetyColons.prototype.evaluate = function (/*context, locals*/) {
  var data = (this.data || '').trimRight().trimLeft();

  if (';' !== data[data.length - 1]) {
    this.data = data + '\n;\n';
  }

  return this.data;
};
