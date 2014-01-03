/** internal
 *  mixin Compressing
 *
 *  An internal mixin whose public methods are exposed on the [[Environment]]
 *  and [[Index]] classes.
 **/


// REQUIRED PROPERTIES /////////////////////////////////////////////////////////
//
// - `__compressors__` (Hash)
//
////////////////////////////////////////////////////////////////////////////////


'use strict';


// 3rd-party
var _ = require('lodash');


////////////////////////////////////////////////////////////////////////////////


/**
 *  Compressing#getCompressors() -> Object
 *
 *  Returns compressors groupped by mime-type.
 **/
module.exports.getCompressors = function () {
  return this.__compressors__.clone();
};


/**
 *  Compressing#registerCompressor(mimeType, name, klass) -> Void
 *
 *  Registers a compressor `klass` as `name` for `mimeType`.
 *
 *      environment.registerCompressor('text/css', 'sass', SassCompressor);
 **/
module.exports.registerCompressor = function (mimeType, name, klass) {
  this.__compressors__.get(mimeType)[name] = klass;
};



/**
 *  Compressing#cssCompressor -> Template
 *
 *  CSS compression function.
 *
 *  This is a magical property, when you assign your function, it automagically
 *  creates an instance of [[Processor]] with provided function as internal
 *  worker. The function you provide expected to have follwoing signature:
 *
 *      env.cssCompressor = function (context, data) {
 *        var compressed_data;
 *        // ... do something with data...
 *        return compressed_data;
 *      };
 *
 *  Also you can use predifined CSS compressor [CssoCompressor] by passing it's
 *  identifier as a string:
 *
 *      env.cssCompressor = 'csso';
 *
 *  Throws Error if compressor is not a function or not registered one.
 **/
Object.defineProperty(module.exports, 'cssCompressor', {
  // Return JS compressor or nil if none is set
  get: function () {
    return this.__cssCompressor__ || null;
  },

  // Assign a compressor to run on `text/css` assets.
  set: function (compressor) {
    var mime = 'text/css';

    if (this.__cssCompressor__) {
      this.unregisterBundleProcessor(mime, this.__cssCompressor__);
    }

    if (_.isFunction(compressor)) {
      this.__cssCompressor__ = compressor;
      this.registerBundleProcessor(mime, 'css_compressor', compressor);
      return;
    }

    if (this.__compressors__.get(mime)[compressor]) {
      this.__cssCompressor__ = this.__compressors__.get(mime)[compressor];
      this.registerBundleProcessor(mime, this.__cssCompressor__);
      return;
    }

    throw new Error('Unknown compressor: ' + compressor);
  }
});


/**
 *  Compressing#jsCompressor -> Template
 *
 *  JavaScript compression function.
 *
 *  This is a magical property, when you assign your function, it automagically
 *  creates an instance of [[Processor]] with provided function as internal
 *  worker. The function you provide expected to have follwoing signature:
 *
 *      env.jsCompressor = function (context, data) {
 *        var compressed_data;
 *        // ... do something with data...
 *        return compressed_data;
 *      };
 *
 *  Also you can use predifined JS compressor [UglifyCompressor] by passing it's
 *  identifier as a string:
 *
 *      env.jsCompressor = 'uglify';
 *
 *  Throws Error if compressor is not a function or not registered one.
 **/
Object.defineProperty(module.exports, 'jsCompressor', {
  // Return JS compressor or nil if none is set
  get: function () {
    return this.__jsCompressor__ || null;
  },

  // Assign a compressor to run on `application/javascript` assets.
  set: function (compressor) {
    var mime = 'application/javascript';

    if (this.__jsCompressor__) {
      this.unregisterBundleProcessor(mime, this.__jsCompressor__);
    }

    if (_.isFunction(compressor)) {
      this.__jsCompressor__ = compressor;
      this.registerBundleProcessor(mime, 'js_compressor', compressor);
      return;
    }

    if (this.__compressors__.get(mime)[compressor]) {
      this.__jsCompressor__ = this.__compressors__.get(mime)[compressor];
      this.registerBundleProcessor(mime, this.__jsCompressor__);
      return;
    }

    throw new Error('Unknown compressor: ' + compressor);
  }
});
