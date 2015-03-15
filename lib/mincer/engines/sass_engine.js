/**
 *  class SassEngine
 *
 *  Engine for the SASS/SCSS compiler. You will need `node-sass` Node module installed
 *  in order to use [[Mincer]] with `*.sass` or `*.scss` files:
 *
 *      npm install node-sass
 *
 *
 *  ##### SUBCLASS OF
 *
 *  [[Template]]
 **/


'use strict';

// stdlib
var path = require('path');
var util = require('util');

// 3rd-party
var _ = require('lodash');
var sass; // initialized later


// internal
var Template  = require('../template');
var prop      = require('../common').prop;
var logger    = require('../logger');


////////////////////////////////////////////////////////////////////////////////


// Class constructor
var SassEngine = module.exports = function SassEngine() {
  Template.apply(this, arguments);
  sass = sass || Template.libs['node-sass'] || require('node-sass');

  // Ensure node sass module has renderSync method
  if (!sass.renderSync) {
    throw new Error('node-sass < v0.5 is not supported.');
  }
};


require('util').inherits(SassEngine, Template);


// helper to generate human-friendly errors.
// adapted version from less_engine.js
function sassError(ctx /*, options*/) {
  // libsass error string format: path:line: error: message
  var error = _.zipObject(
    [ 'path', 'line', 'level', 'message' ],
    ctx.split(':', 4).map(function(str) { return str.trim(); })
  );
  if (error.line && error.level && error.message) {
    return new Error('Line ' + error.line + ': ' + error.message);
  }

  return new Error(ctx);
}


// Render data
SassEngine.prototype.evaluate = function (context/*, locals*/) {
  var self = this;

  try {
    var result = sass.renderSync({
      file:         this.file,
      data:         this.data,
      importer:     function(url, prev) {
        return self.sassImporter(context, url, prev);
      },
      includePaths: [ path.dirname(this.file) ].concat(context.environment.paths),
      indentedSyntax: /^.*\.sass$/.test(this.file)
    });

    this.data = String(result.css || result);
  } catch(err) {
    var error = sassError(err);
    throw error;
  }
};


// Returns the argument of the @import() call relative to the asset search paths.
function importArgumentRelativeToSearchPaths(importer, importArgument, searchPaths) {
  var importAbsolutePath = path.resolve(path.dirname(importer), importArgument);
  var importSearchPath = _.find(searchPaths, function(path) {
    return importAbsolutePath.indexOf(path) === 0;
  });
  if (importSearchPath) {
    return path.relative(importSearchPath, importAbsolutePath);
  }
}


function isFileNotFound(error) {
  return error && error.code === 'FileNotFound';
}


function tryDepend(context, importPath) {
  if (importPath) {
    try {
      context.dependOn(importPath);
    } catch (error) {
      return error;
    }
  }
}


SassEngine.prototype.sassImporter = function (context, url, prev) {
  var importPath = importArgumentRelativeToSearchPaths(prev, url, context.environment.__trail__.paths);
  // "If you have a SCSS or Sass file that you want to import but don't want to compile to a CSS file, you can add an
  // underscore to the beginning of the filename. ... You can then import these files without using the underscore."
  // https://github.com/sass/sass/blob/d26e6f/doc-src/SASS_REFERENCE.md#partials-partials
  var underscoredImportPath = importPath && path.join(path.dirname(importPath), '_' + path.basename(importPath));

  var firstError = tryDepend(context, importPath);
  var secondError = isFileNotFound(firstError) && tryDepend(context, underscoredImportPath);

  // While @import()ing assets outside of the search paths should be strongly discouraged, it is valid. Because the
  // asset is outside of the search path, there's no way to call depend_on() on it, so we shouldn't throw an error.
  if (isFileNotFound(firstError) && isFileNotFound(secondError)) {
    logger.warn(util.format('%s will not change when %s changes, because the file could not be found.', prev, url,
      firstError.message, secondError.message));
  }

  return {
    file: url
  };
};

// Expose default MimeType of an engine
prop(SassEngine, 'defaultMimeType', 'text/css');
