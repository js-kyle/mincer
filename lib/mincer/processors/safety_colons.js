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
 *      environment.unregisterPostprocessor('application/javascript', SafetyColons);
 **/
'use strict';


// 3rd-party
var _ = require('underscore');


// internal
var Template = require('../template');


var SafetyColons = module.exports = function SafetyColons() {
  Template.apply(this, arguments);
};


require('util').inherits(SafetyColons, Template);


SafetyColons.prototype.prepare = function () {};


SafetyColons.prototype.evaluate = function (context, locals, fn) {
  try {
    var buff = new Buffer((this.data || '').trimRight().trimLeft());

    // ";".charCodeAt(0) === 59
    if (59 === buff.get(buff.length - 1)) {
      this.data = this.data + ";\n";
    }

    fn(null, this.data);
  } catch (err) {
    fn(err);
  }
};
