/**
 *  class DebugComments
 *
 *  As we are using Node and most of renderers (like Stylus, Less and so on) are
 *  using callbacks and asynchronous approach really hard, it's nearly
 *  impossible to use original approach of of rendering not-bundled assets for
 *  development environment. So instead we use this post-processor to inject
 *  comments with pathname of the file in front of each bundled file.
 *
 *  This behavior can be disabled with:
 *
 *      environment.unregisterPostProcessor('text/css', DebugComments);
 *      environment.unregisterPostProcessor('application/javascript', DebugComments);
 *
 *
 *  ##### SUBCLASS OF
 *
 *  [[Template]]
 **/


'use strict';


// stdlib
var path = require('path');


// internal
var Template = require('../template');


////////////////////////////////////////////////////////////////////////////////


// Class constructor
var DebugComments = module.exports = function DebugComments() {
  Template.apply(this, arguments);
};


require('util').inherits(DebugComments, Template);


// Process data
DebugComments.prototype.evaluate = function (context, locals, callback) {
  var pathname = path.join(context.rootPath, context.logicalPath);
  this.data = '\n\n/***  ' + pathname + '  ***/\n\n' + this.data;
  callback(null, this.data);
};
