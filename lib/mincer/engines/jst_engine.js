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


// internal
var Template  = require('../template');
var prop      = require('../common').prop;


////////////////////////////////////////////////////////////////////////////////


// Class constructor
var JstEngine = module.exports = function JstEngine() {
  Template.apply(this, arguments);
};


require('util').inherits(JstEngine, Template);


// Internal (private) namespace storage
var namespace = 'this.JST';


/**
 *  JstEngine.configure(ns) -> Void
 *  - ns (String):
 *
 *  Allows to set JST global scope variable name.
 *
 *  Default: `'this.JST'`.
 *
 *
 *  ##### Example
 *
 *      JstEngine.configure('this.tpl');
 **/
JstEngine.configure = function (ns) {
  namespace = String(ns);
};


// Render data
JstEngine.prototype.evaluate = function (context/*, locals*/) {
  this.data = '(function () { ' +
    namespace + ' || (' + namespace + ' = {}); ' +
    namespace + '[' + JSON.stringify(context.logicalPath) + '] = ' +
    this.data.replace(/$(.)/mg, '$1  ').trimLeft().trimRight() +
    ' }).call(this);';
};


// Expose default MimeType of an engine
prop(JstEngine, 'defaultMimeType', 'application/javascript');
