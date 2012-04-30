/** internal
 *  mixin Processing
 *
 *  An internal mixin whose public methods are exposed on the [[Environment]]
 *  and [[Index]] classes.
 **/


'use strict';


// 3rd-party
var _ = require('underscore');


// internal
var Processor = require('./processor');
var getter = require('./common').getter;


function get_processor(obj, mimeType) {
  return obj[mimeType] || (obj[mimeType] = []);
}


/**
 *  Processing#formatExtension -> Array
 *
 *  Returns an `Array` of format extension `String`s.
 *
 *      // => ['.js', '.css']
 **/
getter(module.exports, 'formatExtension', function () {
  return _.difference(this.trail.extensions, _.keys(this.engines));
});


/**
 *  Processing#preprocessors(mimeType = null) -> Array
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
    return get_processor(this.__preprocessors__, mimeType).slice();
  } else {
    return this.__preprocessors__.clone();
  }
};


/**
 *  Processing#postprocessors(mimeType = null) -> Array
 *
 *  Returns an `Array` of `Processor` classes. If a `mime_type`
 *  argument is supplied, the processors registered under that
 *  extension will be returned.
 *
 *  Postprocessors are ran after Preprocessors and Engine processors.
 **/
module.exports.postprocessors = function (mimeType) {
  if (mimeType) {
    return get_processor(this.__postprocessors__, mimeType).slice();
  } else {
    return this.__postprocessors__.clone();
  }
};


/**
 *  Processing#bundleProcessors(mimeType = null) -> Array
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
module.exports.postprocessors = function (mimeType) {
  if (mimeType) {
    return get_processor(this.__bundle_processors__, mimeType).slice();
  } else {
    return this.__bundle_processors__.clone();
  }
};


/**
 *  Processing#registerPreprocessor(mimeType, klass[, fn]) -> Void
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

  get_processor(this.__preprocessors__, mimeType).push(klass);
};


/**
 *  Processing#registerPostprocessor(mimeType, klass[, fn]) -> Void
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

  get_processor(this.__postprocessors__, mimeType).push(klass);
};


/**
 *  Processing#registerBundleProcessor(mimeType, klass[, fn]) -> Void
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

  get_processor(this.__bundle_processors__, mimeType).push(klass);
};


/**
 *  Processing#unregisterPreprocessor(mimeType, klass) -> Void
 *
 *  Remove Preprocessor `klass` for `mime_type`.
 *
 *      unregisterPreprocessor('text/css', DirectiveProcessor);
 **/
module.exports.unregisterPreprocessor = function (mimeType, klass) {
  var processors = get_processor(this.__preprocessors__, mimeType);

  if (_.isString(klass)) {
    klass = _.find(processors, function (fn) {
      return (fn.name && fn.name === "Processor:" + klass);
    });
  }

  this.__preprocessors__[mimeType] = _.without(processors, klass);
};


/**
 *  Processing#unregisterPostprocessor(mimeType, klass) -> Void
 *
 *  Remove Postprocessor `klass` for `mime_type`.
 *
 *      unregisterPostprocessor('text/css', DirectiveProcessor);
 **/
module.exports.unregisterPostprocessor = function (mimeType, klass) {
  var processors = get_processor(this.__postprocessors__, mimeType);

  if (_.isString(klass)) {
    klass = _.find(processors, function (fn) {
      return (fn.name && fn.name === "Processor:" + klass);
    });
  }

  this.__postprocessors__[mimeType] = _.without(processors, klass);
};


/**
 *  Processing#unregisterBundleProcessor(mimeType, klass) -> Void
 *
 *  Remove BundleProcessor `klass` for `mime_type`.
 *
 *      unregisterBundleProcessor('text/css', CharsetNormalizer);
 **/
module.exports.unregisterBundleProcessor = function (mimeType, klass) {
  var processors = get_processor(this.__bundle_processors__, mimeType);

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
    return _.find(get_processor(this.__bundle_processors__, 'text/css'), function (fn) {
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
    return _.find(get_processor(this.__bundle_processors__, 'application/javascript'), function (fn) {
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

  this.trail.appendExtension(ext);

  if (klass.defaultMimeType) {
    format_ext = this.extensionForMimeType(klass.defaultMimeType);
    if (format_ext) {
      this.trail.aliasExtension(ext, format_ext);
    }
  }
};
