/**
 *  class LessEngine
 *
 *  Engine for the Less compiler. Uses `less` Node module.
 **/


'use strict';


// stdlib
var path = require('path');


// 3rd-party
var _ = require('underscore');
var less; // initialized later


// internal
var EngineTemplate = require('../engine_template');
var getter         = require('../common').getter;


var LessEngine = module.exports = function LessEngine() {
  EngineTemplate.apply(this, arguments);
};


require('util').inherits(LessEngine, EngineTemplate);


LessEngine.prototype.prepare = function () {};


// Check whenever Less is loaded
getter(LessEngine.prototype, 'isInitialized', function () {
  return !!less;
});


// Autoload less library. If the library isn't loaded
LessEngine.prototype.initialize = function () {
  less = this.requireTemplateLibrary('less');
};


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


LessEngine.prototype.evaluate = function (context, locals, callback) {
  var parser = new (less.Parser)({
    paths:           [path.dirname(this.file)].concat(context.environment.paths),
    optimization:    1,
    filename:        this.file,
    strictImports:   false
  });

  parser.parse(this.data, function (err, tree) {
    var out;

    if (err) {
      callback(less_error(err));
      return;
    }

    try {
      out = tree.toCSS({
        compress:     false,
        yuicompress:  false
      });

      callback(null, out);
    } catch (err) {
      callback(less_error(err));
    }
  });
};
