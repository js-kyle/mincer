/**
 *  class LessEngine
 *
 *  Engine for the Less compiler. You will need `less` Node module installed
 *  in order to use [[Mincer]] with `*.less` files:
 *
 *      npm install less
 *
 *
 *  ##### SUBCLASS OF
 *
 *  [[Template]]
 **/


'use strict';


// stdlib
var path = require('path');


// 3rd-party
var _ = require('underscore');


// internal
var Template  = require('../template');
var prop      = require('../common').prop;


////////////////////////////////////////////////////////////////////////////////


// Class constructor
var LessEngine = module.exports = exports = function LessEngine() {
  Template.apply(this, arguments);
};

/*
 * Expose engine
 */
exports._engine = null; // initialized later


require('util').inherits(LessEngine, Template);


// Check whenever less module is loaded
LessEngine.prototype.isInitialized = function () {
  return !!exports._engine;
};


// Autoload less library
LessEngine.prototype.initializeEngine = function () {
  exports._engine = this.require('less');
};


// helper to generate human-friendly errors.
// adapted version from original bin/less
function less_error(ctx, options) {
  var message = "";
  var extract = ctx.extract;
  var error   = [];

  if (ctx.stack || !ctx.hasOwnProperty('index')) { return ctx; }

  if (typeof(extract[0]) === 'string') {
    error.push((ctx.line - 1) + ' ' + extract[0]);
  }

  if (extract[1]) {
    error.push(ctx.line + ' ' +
               extract[1].slice(0, ctx.column) +
               extract[1][ctx.column] +
               extract[1].slice(ctx.column + 1));
  }

  if (typeof(extract[2]) === 'string') {
    error.push((ctx.line + 1) + ' ' + extract[2]);
  }

  error   = error.join('\n');
  message = ctx.type + 'Error: ' + ctx.message;

  if (ctx.filename) {
    message += ' in ' + ctx.filename + ':' + ctx.line + ':' + ctx.column;
  }

  return new Error(message + '\n---\n' + error);
}


// Render data
LessEngine.prototype.evaluate = function (context, locals, callback) {
  var self   = this;
  var parser = new (exports._engine.Parser)({
    paths:          [path.dirname(this.file)].concat(context.environment.paths),
    optimization:   1,
    filename:       this.file,
    strictImports:  false
  });

  parser.parse(this.data, function (err, tree) {
    if (err) {
      callback(less_error(err));
      return;
    }

    _.keys(parser.imports.files).forEach(function (file) {
      // LESS <= 1.3.1 was returning paths as they were given,
      // LESS >= 1.3.2 returns them resolved to absolute paths
      context.dependOn(path.resolve(path.dirname(self.file), file));
    });

    try {
      callback(null, tree.toCSS());
    } catch (err) {
      callback(less_error(err));
    }
  });
};


// Expose default MimeType of an engine
prop(LessEngine, 'defaultMimeType', 'text/css');
