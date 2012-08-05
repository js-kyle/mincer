/**
 *  class Template
 *
 *  Template provides a base class for engines and processors. Think of it as of
 *  Ruby's `Tilt::Template` class, that provides unified interface for template
 *  renderers.
 *
 *
 *  ##### Example
 *
 *      // Create subclass
 *      function MyProcessor() { Template.apply(this, arguments); }
 *      require('util').inherits(MyProcessor, Template);
 *
 *      // Define evaluate method
 *      MyProcessor.prototype.evaluate(context, locals, callback) {
 *        var data = this.data.toLowerCase();
 *        callback(null, data);
 *      };
 **/


'use strict';


// stdlib
var fs = require('fs');


// internal
var prop = require('./common').prop;


////////////////////////////////////////////////////////////////////////////////


/**
 *  new Template(file[, reader])
 *  - file (String)
 *  - reader (Function)
 *
 *  Creates new instance of template and fills it with some base properties.
 **/
var Template = module.exports = function Template(file, reader) {
  reader = (reader || function () { return fs.readFileSync(file, 'utf8'); });

  prop(this, 'data', reader(file), {writable: true});
  prop(this, 'file', file);

  if (!this.isInitialized()) {
    this.initializeEngine();
  }
};


/**
 *  Template#isInitialized() -> Boolean
 *
 *  Test whenever template engine/processor was already initialized or not.
 *
 *  You _MAY_ redefine this method in your template if you are using engine
 *  initialization. Default implementation always returns `true`.
 *
 *
 *  ##### Example
 *
 *      var backend; // lazy-load is so lazy
 *      MyProcessor.prototype.isInitialized = function () {
 *        return !!backend;
 *      };
 *
 *
 *  ##### See Also
 *
 *  - [[Template#initializeEngine]]
 **/
Template.prototype.isInitialized = function () {
  return true;
};


/**
 *  Template#initializeEngine() -> Void
 *
 *  Initializes engine, if it's not yet initialized.
 *
 *  You _MAY_ redefine this method in your template if you are using engine
 *  initialization. Default implementation does nothing.
 *
 *
 *  ##### Example
 *
 *      var backend; // lazy-load is so lazy
 *      MyProcessor.prototype.initializeEngine = function () {
 *        backend = require('my-secret-module');
 *      };
 *
 *
 *  ##### See Also
 *
 *  - [[Template#isInitialized]]
 *  - [[Template#require]]
 **/
Template.prototype.initializeEngine = function () {};


/**
 *  Template#evaluate(context, locals, callback) -> Void
 *  - context (Context)
 *  - locals (Object)
 *  - callback (Function)
 *
 *  Real renderer function.
 *
 *  You _MUST_ redefine this method in your template. By default this method is
 *  throws an Error that it's not implemented.
 *
 *
 *  ##### Example
 *
 *      MyProcessor.prototype.evaluate = function (context, locals, callback) {
 *        var data = this.data.replace(this.secret, '***TOP-SECRET***');
 *        callback(null, data);
 *      };
 **/
Template.prototype.evaluate = function (context, locals, callback) {
  throw new Error((this.constructor.name || '') +
                  '#evaluate() is not implemented.');
};


/**
 *  Template#require(name) -> Mixed
 *  - name (String)
 *
 *  Wrapper over native `require()` method, that produces beautified errors.
 *
 *  Used for engines and processors which depends on 3rd-party modules (e.g.
 *  [[StylusEngine]] needs `stylus` module). Once such engine initialized
 *  (if associated file is being processed) and required module not found this
 *  will rethrow Error with some clarification why error happened.
 **/
Template.prototype.require = function (name) {
  try {
    return require(name);
  } catch (err) {
    throw new Error("Cannot find module `" + name +
                    "` required for file '" + this.file + "'");
  }
};
