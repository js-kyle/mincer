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
var _ = require('lodash');
var less; // initialized later


// internal
var Template  = require('../template');
var prop      = require('../common').prop;


////////////////////////////////////////////////////////////////////////////////


// Class constructor
var LessEngine = module.exports = function LessEngine() {
  Template.apply(this, arguments);
  less = less || Template.libs.less || require('less');
};


require('util').inherits(LessEngine, Template);


// helper to generate human-friendly errors.
// adapted version from original bin/less
function lessError(ctx /*, options*/) {
  var message = '';
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
LessEngine.prototype.evaluate = function (context, locals) {
  var error  = null,
      result = null,
      withSoucemap = context.environment.isEnabled('source_maps');

  _.forEach(locals, function(localFunc, localName) {
    less.tree.functions[localName] = function() {
      var extractedLessArguments = _.map(arguments, 'value');

      return new less.tree.Anonymous(localFunc.apply(undefined, extractedLessArguments));
    };
  });

  var parser = new (less.Parser)({
    paths:          [path.dirname(this.file)].concat(context.environment.paths),
    optimization:   1,
    filename:       this.file,
    syncImport:     true,
    strictImports:  false
  });

  parser.parse(this.data, function (err, tree) {
    if (err) {
      error = lessError(err);
      return;
    }

    _.keys(parser.imports.files).forEach(function (file) {
      context.dependOn(file);
    });

    try {

      if (!withSoucemap) {
        result = tree.toCSS();
      } else {
        console.log(context.environment.root);
        result = tree.toCSS({
          sourceMap: true,
          outputSourceFiles: true,
          sourceMapBasepath: context.environment.root,
          //sourceMapOutputFilename: context.relativePath,
          writeSourceMap: function(output) {
            context.sourceMap = output;
          }
        });
      }
    } catch (err) {
      error = lessError(err);
    }
  });

  if (error) {
    throw error;
  }

  return result;
};


// Expose default MimeType of an engine
prop(LessEngine, 'defaultMimeType', 'text/css');
