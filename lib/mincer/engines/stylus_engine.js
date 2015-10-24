/**
 *  class StylusEngine
 *
 *  Engine for the Stylus compiler. You will need `stylus` Node module installed
 *  in order to use [[Mincer]] with `*.stylus` files:
 *
 *      npm install stylus
 *
 *
 *  ##### SUBCLASS OF
 *
 *  [[Template]]
 **/


'use strict';


// stdlib
var path = require('path');
var fs   = require('fs');


// 3rd-party
var _ = require('lodash');
var stylus; // initialized later


// internal
var Template  = require('../template');
var prop      = require('../common').prop;


////////////////////////////////////////////////////////////////////////////////


// Class constructor
var StylusEngine = module.exports = function StylusEngine() {
  Template.apply(this, arguments);
  stylus = stylus || Template.libs.stylus || require('stylus');
};


require('util').inherits(StylusEngine, Template);


// Internal (private) configurator storage
var configurator = function noop() {};


/**
 *  StylusEngine.configure(fn) -> Void
 *  - fn (Function)
 *
 *  Sets `function`, that will be running everytime engine will run renderer.
 *
 *      var nib = require('nib');
 *
 *      Stylus.configure(function (style) {
 *        style.use(nib());
 *      });
 *
 *  Default: `function (_) { 'do nothing'; }`
 **/
StylusEngine.configure = function (fn) {
  configurator = fn;
};


// Render data
StylusEngine.prototype.evaluate = function (context, locals) {
  var withSourcemap = context.environment.isEnabled('source_maps');

  var style = stylus(this.data, {
    paths:    [ path.dirname(this.file) ].concat(context.environment.paths),
    filename: this.file,
    _imports: [],
    sourcemap: !withSourcemap ? false : {
      comment: false
    }
  });

  var error  = null,
      result = null;

  // define helpers from the list of passed locals
  _.forEach(locals, function (helper, name) {
    if (typeof helper !== 'function') {
      // Provide object as a function helper
      style.define(name, function () {
        return helper;
      });
      return;
    }

    // Stylus determine how much arguments to pass on helper function's length
    // So we keep amount of arguments reasonable big...
    style.define(name, function (/*a, b, c, d, e, f, g, h*/) {
      /*jshint unused:false*/
      var o = {};

      [ 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h' ].forEach(function (k, i) {
        o[k] = (this[i] || {}).val;
      }, arguments);

      if (!('context' in this)) {
        this.context = context;
      }

      return helper.call(this, o.a, o.b, o.c, o.d, o.e, o.f, o.g, o.h);
    });
  });

  // run registered configurator
  configurator(style);

  style.render(function (err, css) {
    if (err) {
      error = err;
      return;
    }

    // add Stylus `@import`s as dependencies of current asset
    _.forEach(style.options._imports, function (imported) {
      context.dependOn(imported.path);
    });

    result = css;
  });

  if (error) {
    throw error;
  }

  this.data = result;

  //
  // Now add sourcemap info if needed & available.
  //

  if (withSourcemap && style.sourcemap) {
    var map  = style.sourcemap;
    var dir  = path.dirname(context.pathname);

    map.sources.forEach(function (file, idx) {
      var rel = path.relative(dir, file);
      if (path.sep === '\\') { rel = rel.replace('\\', '/'); }
      map.sources[idx] = rel;
    });

    // Stylus now returns sourcemap without original sources. We should glue
    // those manually. See https://github.com/stylus/stylus/issues/2036
    if (!map.sourcesContent) {
      map.sourcesContent = map.sources.map(function (source) {
        var res = '';

        try {
          res =  fs.readFileSync(path.join(dir, source), 'utf8');
        } catch (__) {}

        return res;
      });
    }

    this.map = JSON.stringify(map);
  }
};


// Expose default MimeType of an engine
prop(StylusEngine, 'defaultMimeType', 'text/css');
