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
 *
 *  ##### Creating JST compatible engines
 *
 *  If you subclass [[Template]] (in Mincer core), you can create your own `JST`
 *  precompiled templates. In order to make own engine compatible with `JST`
 *  processor, there are two options:
 *
 *  1. You can just evaluate the template as an string and pass it to the
 *     callback. For example:
 *
 *      var StrEngine = module.exports = function StrEngine() {
 *        Template.apply(this, arguments);
 *      };
 *
 *      require('util').inherits(StrEngine, Template);
 *
 *      StrEngine.prototype.compile = function () {
 *        var source = this.data;
 *
 *        source = source.split("\n").map(function (l) {
 *          return l.trim();
 *        }).join('\\n').trim();
 *
 *        source = source.replace(/\{\{([^\}]+)\}\}/gi, '" + this.$1 + "');
 *        source = source.replace(/\[\[([^\]]+)\]\]/gi, '" + locals.$1 + "');
 *
 *        return 'function(locals) { return "' + source + '"; }';
 *      };
 *
 *      StrEngine.prototype.evaluate = function (context, locals, callback) {
 *        callback(null, this.compile());
 *      };
 *
 *      Mincer.registerEngine('.str',  StrEngine);
 *
 *  2. You can use lazy evaluation, passing the engine object itself to the
 *     callback and defining the method `toString` and the function member
 *     `lazySource`. For example:
 *
 *      var LzyEngine = module.exports = function LzyEngine() {
 *        Template.apply(this, arguments);
 *      };
 *
 *      require('util').inherits(LzyEngine, Template);
 *
 *      LzyEngine.prototype.toString = function () {
 *        return this.lazySource.call(this.options.context, this.options.locals);
 *      };
 *
 *      LzyEngine.prototype.compile = function () {
 *        var source = this.data;
 *
 *        source = source.split("\n").map(function (l) {
 *          return l.trim();
 *        }).join('\\n').trim();
 *
 *        source = source.replace(/\{\{([^\}]+)\}\}/gi, '" + this.$1 + "');
 *        source = source.replace(/\[\[([^\]]+)\]\]/gi, '" + locals.$1 + "');
 *
 *        return new Function('locals', 'return "' + source  + '";');
 *      };
 *
 *      LzyEngine.prototype.evaluate = function (context, locals, callback) {
 *        this.lazySource = this.compile();
 *        this.options = { "context": context, "locals": locals };
 *        callback(null, this);
 *      };
 *
 *      Mincer.registerEngine('.lzy',  LzyEngine);
 *
 *  The advantage of using the second approach is that your engine can be used
 *  with other following processors in the asset pipeline, not only with `JST`.
 *
 *  ##### See Also
 *
 *  - [[Template#evaluate]]
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
  prop(this, 'acceptLazySource', true, {writable: true});
};


require('util').inherits(JstEngine, Template);


var namespace = 'this.JST';


JstEngine.setNamespace = function (ns) {
  namespace = String(ns);
};


/**
 *  JstEngine#evaluate(context, locals, callback) -> Void
 *  - context (Context)
 *  - locals (Object)
 *  - callback (Function)
 *
 *  Pre-compile javascript templates and make them available in the `this.JST`
 *  variable.
 *
 **/
JstEngine.prototype.evaluate = function (context, locals, callback) {
  /*jshint unused:false*/
  var source = this.data || '',
      logicalPath = context.logicalPath,
      oldLogicalPath;

  // For lazy evaluated templates that can be executed without JST (eg. eco, ejs)
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
