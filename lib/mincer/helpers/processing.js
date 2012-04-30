/** internal
 *  mixin Helpers.Processing
 *
 *  An internal mixin whose public methods are exposed on the [[Environment]]
 *  and [[Index]] classes.
 **/


'use strict';


// 3rd-party
var _ = require('underscore');


// internal
var Processor = require('../processor');
var getter = require('../common').getter;


/**
 *  Helpers.Processing#formatExtension -> Array
 *
 *  Returns an `Array` of format extension `String`s.
 *
 *      // => ['.js', '.css']
 **/
getter(module.exports, 'formatExtension', function () {
  return _.difference(this.__trail__.extensions, _.keys(this.engines));
});


/**
 *  Helpers.Processing#preprocessors(mimeType = null) -> Array
 *
 *  Returns an `Array` of `Processor` classes. If a `mime_type`
 *  argument is supplied, the processors registered under that
 *  extension will be returned.
 *
 *  Preprocessors are ran before Postprocessors and Engine
 *  processors.
 **/
module.exports.preprocessors = function (mimeType) {
  if (mimeType) {
    return this.__preprocessors__.get(mimeType).slice();
  } else {
    return this.__preprocessors__.clone();
  }
};


/**
 *  Helpers.Processing#postprocessors(mimeType = null) -> Array
 *
 *  Returns an `Array` of `Processor` classes. If a `mime_type`
 *  argument is supplied, the processors registered under that
 *  extension will be returned.
 *
 *  Postprocessors are ran after Preprocessors and Engine processors.
 **/
module.exports.postprocessors = function (mimeType) {
  if (mimeType) {
    return this.__postprocessors__.get(mimeType).slice();
  } else {
    return this.__postprocessors__.clone();
  }
};


/**
 *  Helpers.Processing#bundleProcessors(mimeType = null) -> Array
 *
 *  Returns an `Array` of `Processor` classes. If a `mimeType`
 *  argument is supplied, the processors registered under that
 *  extension will be returned.
 *
 *  Bundle Processors are ran on concatenated assets rather than
 *  individual files.
 *
 *  All `Processor`s must follow the [[EngineTemplate]] interface. It is
 *  recommended to subclass [[EngineTemplate]].
 **/
module.exports.bundleProcessors = function (mimeType) {
  if (mimeType) {
    return this.__bundle_processors__.get(mimeType).slice();
  } else {
    return this.__bundle_processors__.clone();
  }
};


/**
 *  Helpers.Processing#registerPreprocessor(mimeType, klass[, fn]) -> Void
 *
 *  Registers a new Preprocessor `klass` for `mime_type`.
 *
 *      registerPreprocessor('text/css', DirectiveProcessor);
 *
 *  A block can be passed for to create a shorthand processor.
 *
 *      registerPreprocessor('text/css', 'my_processor', function (context, data, callback) {
 *        callback(null, data.replace(...));
 *      });
 **/
module.exports.registerPreprocessor = function (mimeType, klass, fn) {
  var name;

  if (fn) {
    name = klass;
    klass = Processor.create(name, fn);
  }

  this.__preprocessors__.get(mimeType).push(klass);
};


/**
 *  Helpers.Processing#registerPostprocessor(mimeType, klass[, fn]) -> Void
 *
 *  Registers a new Postprocessor `klass` for `mime_type`.
 *
 *      registerPostprocessor('text/css', DirectiveProcessor);
 *
 *  A block can be passed for to create a shorthand processor.
 *
 *      registerPostprocessor('text/css', 'my_processor', function (context, data, callback) {
 *        callback(null, data.replace(...));
 *      });
 **/
module.exports.registerPostprocessor = function (mimeType, klass, fn) {
  var name;

  if (fn) {
    name = klass;
    klass = Processor.create(name, fn);
  }

  this.__postprocessors__.get(mimeType).push(klass);
};


/**
 *  Helpers.Processing#registerBundleProcessor(mimeType, klass[, fn]) -> Void
 *
 *  Registers a new BundleProcessor `klass` for `mime_type`.
 *
 *      registerBundleProcessor('text/css', CharsetNormalizer);
 *
 *  A block can be passed for to create a shorthand processor.
 *
 *      registerBundleProcessor('text/css', 'my_processor', function (context, data, callback) {
 *        callback(null, data.replace(...));
 *      });
 **/
module.exports.registerBundleProcessor = function (mimeType, klass, fn) {
  var name;

  if (fn) {
    name = klass;
    klass = Processor.create(name, fn);
  }

  this.__bundle_processors__.get(mimeType).push(klass);
};


/**
 *  Helpers.Processing#unregisterPreprocessor(mimeType, klass) -> Void
 *
 *  Remove Preprocessor `klass` for `mime_type`.
 *
 *      unregisterPreprocessor('text/css', DirectiveProcessor);
 **/
module.exports.unregisterPreprocessor = function (mimeType, klass) {
  var processors = this.__preprocessors__.get(mimeType);

  if (_.isString(klass)) {
    klass = _.find(processors, function (fn) {
      return (fn.name && fn.name === "Processor:" + klass);
    });
  }

  this.__preprocessors__[mimeType] = _.without(processors, klass);
};


/**
 *  Helpers.Processing#unregisterPostprocessor(mimeType, klass) -> Void
 *
 *  Remove Postprocessor `klass` for `mime_type`.
 *
 *      unregisterPostprocessor('text/css', DirectiveProcessor);
 **/
module.exports.unregisterPostprocessor = function (mimeType, klass) {
  var processors = this.__postprocessors__.get(mimeType);

  if (_.isString(klass)) {
    klass = _.find(processors, function (fn) {
      return (fn.name && fn.name === "Processor:" + klass);
    });
  }

  this.__postprocessors__[mimeType] = _.without(processors, klass);
};


/**
 *  Helpers.Processing#unregisterBundleProcessor(mimeType, klass) -> Void
 *
 *  Remove BundleProcessor `klass` for `mime_type`.
 *
 *      unregisterBundleProcessor('text/css', CharsetNormalizer);
 **/
module.exports.unregisterBundleProcessor = function (mimeType, klass) {
  var processors = this.__bundle_processors__.get(mimeType);

  if (_.isString(klass)) {
    klass = _.find(processors, function (fn) {
      return (fn.name === "Processor:" + klass);
    });
  }

  this.__bundle_processors__[mimeType] = _.without(processors, klass);
};


Object.defineProperty(module.exports, 'cssCompressor', {
  // Return JS compressor or nil if none is set
  get: function () {
    return _.find(this.__bundle_processors__.get('text/css'), function (fn) {
      return fn.name === "Processor:css_compressor";
    });
  },

  // Assign a compressor to run on `text/css` assets.
  // The compressor object must respond to `compress` or `compile`.
  set: function (compressor) {
    this.unregisterBundleProcessor('text/css', 'css_compressor');
    if (!compressor) { return; }

    this.registerBundleProcessor('text/css', 'css_compressor', function (context, data, callback) {
      compressor.compress(data, callback);
    });
  }
});


Object.defineProperty(module.exports, 'jsCompressor', {
  // Return JS compressor or nil if none is set
  get: function () {
    return _.find(this.__bundle_processors__.get('application/javascript'), function (fn) {
      return fn.name === "Processor:js_compressor";
    });
  },

  // Assign a compressor to run on `application/javascript` assets.
  // The compressor object must respond to `compress` or `compile`.
  set: function (compressor) {
    this.unregisterBundleProcessor('application/javascript', 'js_compressor');
    if (!compressor) { return; }

    this.registerBundleProcessor('application/javascript', 'js_compressor', function (context, data, callback) {
      compressor.compress(data, callback);
    });
  }
});


module.exports.addEngineToTrail = function (ext, klass) {
  var format_ext;

  this.__trail__.appendExtension(ext);

  if (klass.defaultMimeType) {
    format_ext = this.extensionForMimeType(klass.defaultMimeType);
    if (format_ext) {
      this.__trail__.aliasExtension(ext, format_ext);
    }
  }
};
