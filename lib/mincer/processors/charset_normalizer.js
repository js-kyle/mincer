/**
 *  class CharsetNormalizer
 *
 *  Some browsers have issues with stylesheets that contain multiple
 *  `@charset` definitions. The `CharsetNormalizer` processor strips
 *  out multiple `@charset` definitions.
 *
 *  The current implementation is naive. It picks the first `@charset`
 *  it sees and strips the others. This works for most people because
 *  the other definitions are usually `UTF-8`. A more sophisticated
 *  approach would be to re-encode stylesheets with mixed encodings.
 *
 *  This behavior can be disabled with:
 *
 *      environment.unregisterBundleProcessor('text/css', CharsetNormalizer);
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
var CharsetNormalizer = module.exports = function CharsetNormalizer() {
  Template.apply(this, arguments);
};


require('util').inherits(CharsetNormalizer, Template);


// Cached version of RegExp used to find and process charset directives
var CHARSET_RE = /^@charset "([^"]+)";$/gm;



// Process data
CharsetNormalizer.prototype.evaluate = function (/*context, locals*/) {
  var charset = null;

  this.data = this.data.replace(CHARSET_RE, function (m) {
    charset = charset || m;
    return '';
  });

  if (null !== charset) {
    this.data = charset + '\n' + this.data;
  }
};
