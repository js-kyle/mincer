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
  prop(this, 'acceptLazySource', false, {writable: true});

  if (!this.isInitialized()) {
    this.initializeEngine();
  }
};

/** internal
 *  Template#data -> String | Function
 *
 *  A source string to be compiled or a function for lazy evaluation.
 *
 *  ##### See Also
 *
 *  - [[Template#evaluate]]
 */


/**
 *  Template#acceptLazySource -> Boolean
 *
 *  If your engine accept `[[Template#data data]]` as functions for lazy
 *  evaluation you need to define `acceptLazySource` as true, otherwise all
 *  functions returned in the asset pipeline will be solved and turned into
 *  strings before calling the `[[Template#evaluate evaluate]]` method.
 *
 *  ##### See Also
 *
 *  - [[Template#evaluate]]
 */


/**
 *  Template#lazySource -> Function
 *
 *  Your engine needs to provide either a string or a accept `[[Template#data data]]` as functions for lazy
 *  evaluation you need to define `acceptLazySource` as true, otherwise all
 *  functions returned in the asset pipeline will be solved and turned into
 *  strings before calling the `[[Template#evaluate evaluate]]` method.
 *
 *  ##### See Also
 *
 *  - [[Template#evaluate]]
 */


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
 *  When implementing new engines you can use [[Template#data]] inside this
 *  method as the source to be processed. [[Template#data]] is usually a string.
 *
 *  ##### Example
 *
 *      MyProcessor.prototype.evaluate = function (context, locals, callback) {
 *        var data = this.data.replace(this.secret, '***TOP-SECRET***');
 *        callback(null, data);
 *      };
 *
 *  In order to accept [[Template#data]] as functions, you need to set
 *  [[Template#acceptLazySource]] to true.
 *
 *  ##### Example
 *      var OtherProcessor = module.exports = function EcoEngine() {
 *        Template.apply(this, arguments);
 *        this.acceptLazySource = true;
 *        this.secret = "<? *secret* ?>";
 *      };
 *
 *      require('util').inherits(OtherProcessor, Template);
 *
 *      OtherProcessor.prototype.evaluate = function (context, locals, callback) {
 *        var data;
 *        if (this.data.call) {
 *          data = this.data.call(context);
 *        } else {
 *          data = this.data;
 *        }
 *        callback(null, data.replace(this.secret, '***TOP-SECRET***'));
 *      };
 *
 *  The `evaluate` method could pass to the callback function a string as the
 *  result of the asset compilation or the template itself for lazy evaluation.
 *  If you want to perform lazy evaluation, then you need to define a `toString`
 *  method and a `lazySource` Functin member. If the following processor in
 *  asset pipeline accept lazy sources, the `lazySource` Functin member will be
 *  passed as it [[Template#data]], otherwise the method `toString` will be
 *  called and the resulting string will be passed as [[Template#data]].
 *
 *  ##### Example
 *
 *      LazyProcessor.prototype.toString = function () {
 *        return this.lazySource.call(this.options.context, this.options.locals);
 *      };
 *
 *      LazyProcessor.prototype.evaluate = function (context, locals, callback) {
 *        var source = '"' + this.data.replace(/{{(\w+)}}/gi, '" + this.$1 + "');
 *        source = source.replace(/\[\[(\w+)\]\]/gi, '" + locals.$1 + "') + '"';
 *        this.lazySource = new Function('locals', 'return ' + source + ';');
 *        this.options = { "context": context, "locals": locals };
 *        callback(null, this);
 *      };
 *
 *  Passing the template itself to the callback is useful when precompiling with
 *  template engines like `eco` or `ejs`. The `JST` processor can use the
 *  source of function `lazySource` to generate pre-compiled templates while
 *  other processors can use the returned string to perform future compilations.
 *
 *  ##### See Also
 *
 *  - [[Template#data]]
 *  - [[Template#acceptLazySource]]
 *  - [[Template#lazySource]]
 **/
Template.prototype.evaluate = function (/*context, locals, callback*/) {
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
