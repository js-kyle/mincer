/** internal
 *  class SafetyColons
 *
 *  Subclass of [[Template]].
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


// internal
var Template = require('../template');


////////////////////////////////////////////////////////////////////////////////


// Class constructor
var SafetyColons = module.exports = function SafetyColons() {
  Template.apply(this, arguments);
};


require('util').inherits(SafetyColons, Template);


// Process data
SafetyColons.prototype.evaluate = function (context, locals, fn) {
  try {
    var data = (this.data || '').trimRight().trimLeft();

    if (';' !== data[data.length - 1]) {
      this.data = data + "\n;\n";
    }

    fn(null, this.data);
  } catch (err) {
    fn(err);
  }
};
