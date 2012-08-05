/** internal
 *  class Asset
 *
 *  The base class for [[BundledAsset]], [[ProcessedAsset]] and [[StaticAsset]].
 **/


'use strict';


// stdlib
var fs    = require('fs');
var path  = require('path');
var zlib  = require('zlib');


// 3rd-party
var async   = require('async');
var fstools = require('fs-tools');


// internal
var noop    = require('../common').noop;
var prop    = require('../common').prop;
var getter  = require('../common').getter;


////////////////////////////////////////////////////////////////////////////////


/**
 *  new Asset(environment, logicalPath, pathname)
 *  - environment (Environment)
 *  - logicalPath (String)
 *  - pathname (String)
 **/
var Asset = module.exports = function Asset(environment, logicalPath, pathname) {
  prop(this, 'root',          environment.root);
  prop(this, 'environment',   environment);
  prop(this, 'logicalPath',   logicalPath);
  prop(this, 'pathname',      pathname);
  prop(this, 'contentType',   environment.contentTypeOf(pathname));
  prop(this, 'mtime',         environment.stat(pathname).mtime, {writable: true});
  prop(this, 'length',        environment.stat(pathname).size, {writable: true});
  prop(this, 'digest',        environment.getFileDigest(pathname), {writable: true});

  prop(this, '__requiredAssets__',  [], {writable: true});
  prop(this, '__dependencyPaths__', [], {writable: true});
};


// helper to sub-out getters of Asset.prototype
function stub_getter(name) {
  getter(Asset.prototype, name, function () {
    // this should never happen, as Asset is an abstract class and not
    // supposed to be used directly. subclasses must override this getters
    throw new Error(this.constructor.name + "#" + name + " getter is not implemented.");
  });
}


/**
 *  Asset#buffer -> Buffer
 *
 *  `Buffer` content of asset.
 **/
stub_getter('buffer');


/**
 *  Asset#source -> String
 *
 *  `String` (concatenated) content of asset.
 **/
stub_getter('source');


/**
 *  Asset#digestPath -> String
 *
 *  Return logical path with digest spliced in.
 *
 *      "foo/bar-ce09b59f734f7f5641f2962a5cf94bd1.js"
 **/
getter(Asset.prototype, 'digestPath', function () {
  var ext = path.extname(this.logicalPath),
      sfx = '-' + this.digest + ext;
  return this.logicalPath.replace(new RegExp(ext + '$'), sfx);
});


/**
 *  Asset#toArray() -> Array
 *
 *  Expand asset into an `Array` of parts.
 *
 *  Appending all of an assets body parts together should give you
 *  the asset's contents as a whole.
 **/
Asset.prototype.toArray = function () {
  return [this];
};


/** alias of: Asset#source
 *  Asset#toString() -> String
 **/
Asset.prototype.toString = function () {
  return this.source;
};


/**
 *  Asset.isDependencyFresh(environment, dep) -> Boolean
 *  - environment (Environment|Index)
 *  - dep (Asset)
 *
 *  Returns whenever given `dep` asset is fresh by checking it's mtime, and
 *  contents if it's match.
 **/
Asset.isDependencyFresh = function (environment, dep) {
  var stat = environment.stat(dep.pathname);

  // If path no longer exists, its definitely stale.
  if (!stat) {
    return false;
  }

  // Compare dependency mime to the actual mtime. If the
  // dependency mtime is newer than the actual mtime, the file
  // hasn't changed since we created this `Asset` instance.
  //
  // However, if the mtime is newer it doesn't mean the asset is
  // stale. Many deployment environments may recopy or recheckout
  // assets on each deploy. In this case the mtime would be the
  // time of deploy rather than modified time.
  if (dep.mtime.getTime() >= stat.mtime.getTime()) {
    return true;
  }

  // If the mtime is newer, do a full digest comparsion.
  // Return fresh if the digests match. Otherwise, its stale.
  return (dep.digest === environment.getFileDigest(dep.pathname));
};


/**
 *  Asset#isFresh(environment) -> Boolean
 *  - environment (Environment|Index)
 *
 *  Checks if Asset is fresh by comparing the actual mtime and
 *  digest to the inmemory model.
 *
 *  Used to test if cached models need to be rebuilt.
 **/
Asset.prototype.isFresh = function (environment) {
  return Asset.isDependencyFresh(environment, this);
};


/** internal
 *  Asset#dependencyPaths -> Array
 *
 *  String paths that are marked as dependencies after processing.
 *  Default to an empty `Array`.
 **/
getter(Asset.prototype, 'dependencyPaths', function () {
  this._requireCompilation('dependencyPaths');
  return this.__dependencyPaths__.slice();
});


/** internal
 *  Asset#requiredAssets -> Array
 *
 *  `ProcessedAsset`s that are required after processing.
 *  Default to an empty `Array`.
 **/
getter(Asset.prototype, 'requiredAssets', function () {
  this._requireCompilation('requiredAssets');
  return this.__requiredAssets__.slice();
});


// simple (no compression) or gzipped writer handler
var copier = {
  simple: function (buffer, to, callback) {
    fs.writeFile(to, buffer, callback);
  },

  gzipped: function (buffer, to, callback) {
    zlib.gzip(buffer, function (err, buffer) {
      if (err) {
        callback(err);
        return;
      }

      fs.writeFile(to, buffer, callback);
    });
  }
};


/**
 *  Asset#writeTo(filename, options, callback, callback) -> Void
 *  - filename (String)
 *  - options (Object)
 *  - callback (Function)
 *
 *  Save asset to disk. Automatically gzip content if `options.compress` is true
 *  or `filename` matches `*.gz` pattern.
 **/
Asset.prototype.writeTo = function (filename, options, callback) {
  var self     = this,
      mtime    = this.mtime,
      tempname = filename + "+",
      copy_fn;

  options = options || {};

  if (!callback) {
    callback  = options;
    options   = {};
  }

  if (undefined === options.compress && '.gz' === path.extname(filename)) {
    options.compress = true;
  }

  copy_fn = copier[options.compress ? 'gzipped' : 'simple'];

  async.series([
    function (next) { self.compile(next); },
    function (next) { fstools.mkdir(path.dirname(filename), next); },
    function (next) { copy_fn(self.buffer, tempname, next); },
    function (next) { fs.rename(tempname, filename, next); },
    function (next) { fs.utimes(filename, mtime, mtime, next); },
    function (next) { fstools.remove(tempname, next); }
  ], callback);
};


/**
 *  Asset#compile([callback]) -> Void
 *
 *  Compiles asset and fires `callback(err, asset)` once it was compiled.
 **/
Asset.prototype.compile = function (callback) {
  (callback || noop)(null, this);
};


/**
 *  Asset#isCompiled -> Boolean
 *
 *  Reflects whenever asset is compiled or not.
 **/
stub_getter('isCompiled');


/*:nodoc:*
 *  Asset#_requireCompilation() -> Void
 *
 *  Dummy helper that throws an exception when called the time
 *  [[Asset#isCompiled]] is false.
 **/
Asset.prototype._requireCompilation = function (name) {
  if (!this.isCompiled) {
    throw new Error("Can't get " + name + ": asset was not compiled yet.");
  }
};
