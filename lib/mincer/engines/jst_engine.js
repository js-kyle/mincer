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
var path  = require('path');


// internal
var Template  = require('../template');
var prop      = require('../common').prop;


////////////////////////////////////////////////////////////////////////////////


// Class constructor
var JstEngine = module.exports = function JstEngine() {
  Template.apply(this, arguments);
  prop(this, 'acceptCallable', true, {writable: true});
};


require('util').inherits(JstEngine, Template);


var namespace = 'this.JST';


JstEngine.setNamespace = function (ns) {
  namespace = String(ns);
};


// Render data
JstEngine.prototype.evaluate = function (context, locals, callback) {
  var ext,
      source = this.data || '',
      logicalPath = context.logicalPath,
      oldLogicalPath;

  // For javascript templates that are not concatenated with jst (ex. eco)
  if (source instanceof Function) {
    source = source.toString();
  }

  // JST members should not have extensions in the name
  oldLogicalPath = '';
  while (oldLogicalPath !== logicalPath) {
    oldLogicalPath = logicalPath;
    logicalPath    = logicalPath.replace(path.extname(logicalPath), '');
  }

  // JST members should have "unix path separators"
  oldLogicalPath = '';
  while (path.sep !== '/' && oldLogicalPath !== logicalPath) {
    oldLogicalPath = logicalPath;
    logicalPath    = logicalPath.replace(path.sep, '/');
  }

  callback(
    null,
    "(function () {\n" +
    namespace + " || (" + namespace + " = {}); " +
    namespace + "[" + JSON.stringify(logicalPath) + "] = " +
    source.replace(/$(.)/mg, '$1  ').trimLeft().trimRight() +
    "\n}).call(this);"
  );
};


// Expose default MimeType of an engine
prop(JstEngine, 'defaultMimeType', 'application/javascript');
