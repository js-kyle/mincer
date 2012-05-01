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
 **/
'use strict';


// 3rd-party
var _ = require('underscore');


// internal
var Template = require('../template');


var CharsetNormalizer = module.exports = function CharsetNormalizer() {
  Template.apply(this, arguments);
};


require('util').inherits(CharsetNormalizer, Template);


CharsetNormalizer.prototype.prepare = function () {};


CharsetNormalizer.prototype.evaluate = function (context, locals, fn) {
  var charset = null;

  this.data = this.data.replace(/^@charset "([^"]+)";$/, function (m) {
    charset = charset || m[0];
    return "";
  });

  if (null !== charset) {
    this.data = charset + this.data;
  }

  fn(null, this.data);
};
