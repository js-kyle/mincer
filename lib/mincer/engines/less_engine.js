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
var fs = require('fs');

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


// Temporary workaround which doing import to be synchronous
//
var isUrlRe = /^(?:https?:)?\/\//i;


function lessImporterSync(file, currentFileInfo, callback, env) {
  var pathname, dirname, data;

  var newFileInfo = {
    relativeUrls: env.relativeUrls,
    entryPath: currentFileInfo.entryPath,
    rootpath: currentFileInfo.rootpath,
    rootFilename: currentFileInfo.rootFilename
  };

  if (isUrlRe.test(file) || isUrlRe.test(currentFileInfo.currentDirectory)) {
    throw new Error('Cannot import file by url: ' + file);
  }

  function parseFile(e, data) {
    if (e) { callback(e); return; }

    env = new less.tree.parseEnv(env);
    env.processImports = false;

    var j = file.lastIndexOf('/');

    // Pass on an updated rootpath if path of imported file is relative and file
    // is in a (sub|sup) directory
    //
    // Examples:
    // - If path of imported file is 'module/nav/nav.less' and rootpath is 'less/',
    //   then rootpath should become 'less/module/nav/'
    // - If path of imported file is '../mixins.less' and rootpath is 'less/',
    //   then rootpath should become 'less/../'
    if(newFileInfo.relativeUrls && !/^(?:[a-z-]+:|\/)/.test(file) && j !== -1) {
      var relativeSubDirectory = file.slice(0, j+1);
      newFileInfo.rootpath = newFileInfo.rootpath + relativeSubDirectory; // append (sub|sup) directory path of imported file
    }
    newFileInfo.currentDirectory = pathname.replace(/[^\\\/]*$/, '');
    newFileInfo.filename = pathname;

    env.contents[pathname] = data;      // Updating top importing parser content cache.
    env.currentFileInfo = newFileInfo;
    new(less.Parser)(env).parse(data, function (e, root) {
      callback(e, root, pathname);
    });
  }

  var paths = [currentFileInfo.currentDirectory].concat(env.paths);
  paths.push('.');

  for (var i = 0; i < paths.length; i++) {
    try {
      pathname = path.join(paths[i], file);
      fs.statSync(pathname);
      break;
    } catch (e) {
      pathname = null;
    }
  }

  if (!pathname) {
    callback({ type: 'File', message: '\'' + file + ' was not found' });
    return;
  }

  dirname = path.dirname(pathname);

  try {
    data = fs.readFileSync(pathname, 'utf-8');
    parseFile(null, data);
  } catch (e) {
    parseFile(e);
  }
}

// Render data
LessEngine.prototype.evaluate = function (context, locals) {
  var self   = this;

  var error  = null,
      result = null;

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

  // Monkey fix for syncImport bug
  var originalImporter = less.Parser.importer;
  less.Parser.importer = lessImporterSync;

  parser.parse(this.data, function (err, tree) {
    if (err) {
      error = lessError(err);
      return;
    }

    _.keys(parser.imports.files).forEach(function (file) {
      // LESS <= 1.3.1 was returning paths as they were given,
      // LESS >= 1.3.2 returns them resolved to absolute paths
      context.dependOn(path.resolve(path.dirname(self.file), file));
    });

    try {
      result = tree.toCSS();
    } catch (err) {
      error = lessError(err);
    }
  });

  // Monkey fix for syncImport bug
  less.Parser.importer = originalImporter;

  if(error){
    throw error;
  }

  return result;
};


// Expose default MimeType of an engine
prop(LessEngine, 'defaultMimeType', 'text/css');
