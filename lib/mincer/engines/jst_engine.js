/**
 *  class JstEngine
 *
 *  Engine for the JST files. This is a core wrapper, that wraps function
 *  prepared by view renderers like Haml Coffee.
 *
 *
 *  ##### SUBCLASS OF
 *
 *  [[Template]]
 **/


'use strict';


// 3rd-party
var _ = require('underscore');


// internal
var Template  = require('../template');
var prop      = require('../common').prop;


////////////////////////////////////////////////////////////////////////////////


// Class constructor
var JstEngine = module.exports = function JstEngine() {
  Template.apply(this, arguments);
};


require('util').inherits(JstEngine, Template);


var namespace = 'this.JST';


JstEngine.setNamespace = function (ns) {
  namespace = String(ns);
};


// Render data
JstEngine.prototype.evaluate = function (context, locals, callback) {
  callback(
    null,
    "(function () {\n" +
    namespace + " || (" + namespace + " = {}); " +
    namespace + "[" + JSON.stringify(context.logicalPath) + "] = " +
    this.data.replace(/$(.)/mg, '$1  ').trimLeft().trimRight() +
    "\n}).call(this);"
  );
};


// Expose default MimeType of an engine
prop(JstEngine, 'defaultMimeType', 'application/javascript');
