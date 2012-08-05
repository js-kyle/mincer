/** internal
 *  mixin Processing
 *
 *  An internal mixin whose public methods are exposed on the [[Environment]]
 *  and [[Index]] classes.
 **/


// REQUIRED MIXINS /////////////////////////////////////////////////////////////
//
// - [[Mime]]
// - [[Paths]]
//
// REQUIRED PROPERTIES /////////////////////////////////////////////////////////
//
// - `__trail__` (Hike.Trail)
// - `__preProcessors__` (Types.Hash)
// - `__postProcessors__` (Types.Hash)
// - `__bundleProcessors__` (Types.Hash)
//
////////////////////////////////////////////////////////////////////////////////


'use strict';


// 3rd-party
var _ = require('underscore');


// internal
var Processor = require('../processor');
var getter    = require('../common').getter;


////////////////////////////////////////////////////////////////////////////////


/**
 *  Processing#formatExtension -> Array
 *
 *  Returns an `Array` of format extension `String`s.
 *
 *      // => ['.js', '.css']
 **/
getter(module.exports, 'formatExtension', function () {
  return _.difference(this.extensions, _.keys(this.engines));
});


/**
 *  Processing#getPreProcessors(mimeType = null) -> Array|Types.Hash
 *
 *  Returns an `Array` of `Processor` classes. If a `mime_type`
 *  argument is supplied, the processors registered under that
 *  extension will be returned.
 *
 *  Preprocessors are ran before Postprocessors and Engine
 *  processors.
 **/
module.exports.getPreProcessors = function (mimeType) {
  if (mimeType) {
    return this.__preProcessors__.get(mimeType).slice();
  } else {
    return this.__preProcessors__.clone();
  }
};


/**
 *  Processing#getPostProcessors(mimeType = null) -> Array|Types.Hash
 *
 *  Returns an `Array` of `Processor` classes. If a `mime_type`
 *  argument is supplied, the processors registered under that
 *  extension will be returned.
 *
 *  Postprocessors are ran after Preprocessors and Engine processors.
 **/
module.exports.getPostProcessors = function (mimeType) {
  if (mimeType) {
    return this.__postProcessors__.get(mimeType).slice();
  } else {
    return this.__postProcessors__.clone();
  }
};


/**
 *  Processing#getBundleProcessors(mimeType = null) -> Array|Types.Hash
 *
 *  Returns an `Array` of `Processor` classes. If a `mimeType`
 *  argument is supplied, the processors registered under that
 *  extension will be returned.
 *
 *  Bundle Processors are ran on concatenated assets rather than
 *  individual files.
 *
 *  All `Processor`s must follow the [[Template]] interface. It is
 *  recommended to subclass [[Template]].
 **/
module.exports.getBundleProcessors = function (mimeType) {
  if (mimeType) {
    return this.__bundleProcessors__.get(mimeType).slice();
  } else {
    return this.__bundleProcessors__.clone();
  }
};


/**
 *  Processing#registerPreProcessor(mimeType, klass[, fn]) -> Void
 *
 *  Registers a new preprocessor `klass` for `mime_type`.
 *
 *      registerPreprocessor('text/css', DirectiveProcessor);
 *
 *  A function can be passed for to create a shorthand processor.
 *
 *      registerPreProcessor('text/css', 'my_processor', function (context, data, callback) {
 *        callback(null, data.replace(...));
 *      });
 **/
module.exports.registerPreProcessor = function (mimeType, klass, fn) {
  var name;

  if (fn) {
    name  = klass;
    klass = Processor.create(name, fn);
  }

  this.__preProcessors__.get(mimeType).push(klass);
};


/**
 *  Processing#registerPostProcessor(mimeType, klass[, fn]) -> Void
 *
 *  Registers a new Postprocessor `klass` for `mime_type`.
 *
 *      registerPostprocessor('text/css', DirectiveProcessor);
 *
 *  A function can be passed for to create a shorthand processor.
 *
 *      registerPostprocessor('text/css', 'my_processor', function (context, data, callback) {
 *        callback(null, data.replace(...));
 *      });
 **/
module.exports.registerPostProcessor = function (mimeType, klass, fn) {
  var name;

  if (fn) {
    name  = klass;
    klass = Processor.create(name, fn);
  }

  this.__postProcessors__.get(mimeType).push(klass);
};


/**
 *  Processing#registerBundleProcessor(mimeType, klass[, fn]) -> Void
 *
 *  Registers a new BundleProcessor `klass` for `mime_type`.
 *
 *      registerBundleProcessor('text/css', CharsetNormalizer);
 *
 *  A function can be passed for to create a shorthand processor.
 *
 *      registerBundleProcessor('text/css', 'my_processor', function (context, data, callback) {
 *        callback(null, data.replace(...));
 *      });
 **/
module.exports.registerBundleProcessor = function (mimeType, klass, fn) {
  var name;

  if (fn) {
    name  = klass;
    klass = Processor.create(name, fn);
  }

  this.__bundleProcessors__.get(mimeType).push(klass);
};


/**
 *  Processing#unregisterPreProcessor(mimeType, klass) -> Void
 *
 *  Remove Preprocessor `klass` for `mime_type`.
 *
 *      unregisterPreprocessor('text/css', DirectiveProcessor);
 **/
module.exports.unregisterPreProcessor = function (mimeType, klass) {
  var processors = this.__preProcessors__.get(mimeType);

  if (_.isString(klass)) {
    klass = _.find(processors, function (fn) {
      return (fn.name && fn.name === "Processor:" + klass);
    });
  }

  this.__preProcessors__.set(mimeType, _.without(processors, klass));
};


/**
 *  Processing#unregisterPostProcessor(mimeType, klass) -> Void
 *
 *  Remove Postprocessor `klass` for `mime_type`.
 *
 *      unregisterPostprocessor('text/css', DirectiveProcessor);
 **/
module.exports.unregisterPostProcessor = function (mimeType, klass) {
  var processors = this.__postProcessors__.get(mimeType);

  if (_.isString(klass)) {
    klass = _.find(processors, function (fn) {
      return (fn.name && fn.name === "Processor:" + klass);
    });
  }

  this.__postProcessors__.set(mimeType, _.without(processors, klass));
};


/**
 *  Processing#unregisterBundleProcessor(mimeType, klass) -> Void
 *
 *  Remove BundleProcessor `klass` for `mime_type`.
 *
 *      unregisterBundleProcessor('text/css', CharsetNormalizer);
 **/
module.exports.unregisterBundleProcessor = function (mimeType, klass) {
  var processors = this.__bundleProcessors__.get(mimeType);

  if (_.isString(klass)) {
    klass = _.find(processors, function (fn) {
      return (fn.name === "Processor:" + klass);
    });
  }

  this.__bundleProcessors__.set(mimeType, _.without(processors, klass));
};


/**
 *  Processing#cssCompressor -> Processor
 *
 *  CSS compression function.
 *
 *  This is a magical property, when you assign your function, it automagically
 *  creates an instance of [[Processor]] with provided function as internal
 *  worker. The function you provide expected to have follwoing signature:
 *
 *      env.cssCompressor = function (context, data, callback) {
 *        // ... do something with data then fire callback with result
 *        callback(err, result);
 *      };
 *
 *  But, getting the value of this property will return a subclass of
 *  [[Processor]].
 **/
Object.defineProperty(module.exports, 'cssCompressor', {
  // Return JS compressor or nil if none is set
  get: function () {
    return _.find(this.__bundleProcessors__.get('text/css'), function (fn) {
      return fn.__name__ === "Processor:css_compressor";
    });
  },

  // Assign a compressor to run on `text/css` assets.
  set: function (compress) {
    this.unregisterBundleProcessor('text/css', 'css_compressor');

    if (!_.isFunction(compress)) {
      return;
    }

    this.registerBundleProcessor('text/css', 'css_compressor', compress);
  }
});


/**
 *  Processing#jsCompressor -> Processor
 *
 *  JavaScript compression function.
 *
 *  This is a magical property, when you assign your function, it automagically
 *  creates an instance of [[Processor]] with provided function as internal
 *  worker. The function you provide expected to have follwoing signature:
 *
 *      env.jsCompressor = function (context, data, callback) {
 *        // ... do something with data then fire callback with result
 *        callback(err, result);
 *      };
 *
 *  But, getting the value of this property will return a subclass of
 *  [[Processor]].
 **/
Object.defineProperty(module.exports, 'jsCompressor', {
  // Return JS compressor or nil if none is set
  get: function () {
    return _.find(this.__bundleProcessors__.get('application/javascript'), function (fn) {
      return fn.__name__ === "Processor:js_compressor";
    });
  },

  // Assign a compressor to run on `application/javascript` assets.
  set: function (compress) {
    this.unregisterBundleProcessor('application/javascript', 'js_compressor');

    if (!_.isFunction(compress)) {
      return;
    }

    this.registerBundleProcessor('application/javascript', 'js_compressor', compress);
  }
});


/** internal
 *  Processing#addEngineToTrail(ext, klass) -> Void
 *
 *  Registers extension (and corresponding aliases) for given `klass` in
 *  the `trail`.
 **/
module.exports.addEngineToTrail = function (ext, klass) {
  var format_ext;

  this.__trail__.extensions.append(ext);

  if (klass.defaultMimeType) {
    format_ext = this.getExtensionForMimeType(klass.defaultMimeType);
    if (format_ext) {
      this.__trail__.aliases.append(format_ext, ext);
    }
  }
};
